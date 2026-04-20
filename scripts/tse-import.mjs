#!/usr/bin/env node
/**
 * TSE Import Worker (GitHub Actions)
 * - Baixa ZIP oficial do TSE (CDN)
 * - Extrai CSV via stream (sem carregar tudo na memória)
 * - Parseia em lotes e envia para Edge Function `tse-ingest-chunk`
 *
 * Variáveis de ambiente:
 *   SUPABASE_URL          ex: https://xxx.supabase.co
 *   TSE_INGEST_TOKEN      token compartilhado com a edge function
 *   TIPO                  eleitorado | locais | candidatos | resultados
 *   ANO                   ex: 2024
 *   UF                    ex: BA  (use BR para arquivo nacional)
 */
import https from "node:https";
import { pipeline } from "node:stream/promises";
import unzipper from "unzipper";
import { parse } from "csv-parse";
import fetch from "node-fetch";

const SUPABASE_URL = process.env.SUPABASE_URL;
const TOKEN = process.env.TSE_INGEST_TOKEN;
const TIPO = (process.env.TIPO || "eleitorado").toLowerCase();
const ANO = parseInt(process.env.ANO || "2024", 10);
const UF = (process.env.UF || "BA").toUpperCase();

if (!SUPABASE_URL || !TOKEN) {
  console.error("Faltam SUPABASE_URL ou TSE_INGEST_TOKEN");
  process.exit(1);
}

const INGEST_URL = `${SUPABASE_URL}/functions/v1/tse-ingest-chunk`;
const CHUNK = 500;

// ---------- URLs oficiais TSE ----------
function buildUrl() {
  // Estrutura observada no CDN do TSE
  // https://cdn.tse.jus.br/estatistica/sead/odsele/<dataset>/<arquivo>.zip
  switch (TIPO) {
    case "eleitorado":
      return `https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado/perfil_eleitorado_${ANO}.zip`;
    case "locais":
      return `https://cdn.tse.jus.br/estatistica/sead/odsele/eleitorado_locais_votacao/eleitorado_local_votacao_${ANO}.zip`;
    case "candidatos":
      return `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_${ANO}.zip`;
    case "resultados":
      return `https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/votacao_secao_${ANO}_${UF}.zip`;
    default:
      throw new Error(`TIPO inválido: ${TIPO}`);
  }
}

function tabelaDestino() {
  return {
    eleitorado: "tse_eleitorado",
    locais: "tse_locais_votacao",
    candidatos: "tse_candidatos",
    resultados: "tse_resultados_secao",
  }[TIPO];
}

// ---------- HTTP helpers ----------
function downloadStream(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; LovableTSEImporter/1.0; +https://lovable.dev)",
          Accept: "*/*",
        },
      },
      (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          downloadStream(res.headers.location).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} em ${url}`));
          return;
        }
        resolve(res);
      }
    );
    req.on("error", reject);
  });
}

async function postChunk(registros, attempt = 0) {
  const res = await fetch(INGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Ingest-Token": TOKEN,
    },
    body: JSON.stringify({
      tabela: tabelaDestino(),
      registros,
    }),
  });

  const json = await res.json().catch(async () => {
    const txt = await res.text();
    throw new Error(`Resposta inválida do ingest: ${txt}`);
  });

  if (json?.retry && attempt < 5) {
    const wait = 500 * Math.pow(2, attempt + 1) + Math.floor(Math.random() * 500);
    await new Promise((r) => setTimeout(r, wait));
    return postChunk(registros, attempt + 1);
  }

  if (!res.ok || json?.error) {
    throw new Error(json?.error || `Ingest falhou ${res.status}`);
  }

  return json;
}

// ---------- Mappers (CSV TSE → tabela Supabase) ----------
function mapRow(row) {
  // Filtra UF quando aplicável
  const ufRow = row.SG_UF || row.UF || row.SG_UE;
  if (UF !== "BR" && ufRow && ufRow !== UF) return null;

  switch (TIPO) {
    case "eleitorado":
      return {
        ano: ANO,
        uf: ufRow || UF,
        cod_municipio_tse: row.CD_MUNICIPIO || row.CD_MUNIC_TSE || null,
        zona: row.NR_ZONA ? Number(row.NR_ZONA) : null,
        secao: row.NR_SECAO ? Number(row.NR_SECAO) : null,
        total_eleitores: Number(row.QT_ELEITORES_PERFIL || row.QT_ELEITORES || 0),
        genero: row.DS_GENERO ? { [row.DS_GENERO]: 1 } : null,
        faixa_etaria: row.DS_FAIXA_ETARIA ? { [row.DS_FAIXA_ETARIA]: 1 } : null,
        escolaridade: row.DS_GRAU_ESCOLARIDADE
          ? { [row.DS_GRAU_ESCOLARIDADE]: 1 }
          : null,
        estado_civil: row.DS_ESTADO_CIVIL ? { [row.DS_ESTADO_CIVIL]: 1 } : null,
      };

    case "locais":
      return {
        ano: ANO,
        uf: ufRow || UF,
        cod_municipio_tse: row.CD_MUNICIPIO || null,
        codigo_local: String(row.NR_LOCAL_VOTACAO || row.CD_LOCAL_VOTACAO || ""),
        nome_local: row.NM_LOCAL_VOTACAO || null,
        endereco: row.DS_ENDERECO || null,
        bairro: row.NM_BAIRRO || null,
        cep: row.NR_CEP || null,
        zona: Number(row.NR_ZONA || 0),
        latitude: row.NR_LATITUDE ? Number(row.NR_LATITUDE) : null,
        longitude: row.NR_LONGITUDE ? Number(row.NR_LONGITUDE) : null,
      };

    case "candidatos":
      return {
        ano: ANO,
        uf: ufRow || UF,
        turno: Number(row.NR_TURNO || 1),
        cargo: row.DS_CARGO || row.CD_CARGO || "",
        numero_urna: String(row.NR_CANDIDATO || ""),
        nome_urna: row.NM_URNA_CANDIDATO || null,
        nome_completo: row.NM_CANDIDATO || null,
        cpf: row.NR_CPF_CANDIDATO || null,
        partido_sigla: row.SG_PARTIDO || null,
        partido_numero: row.NR_PARTIDO || null,
        coligacao: row.NM_COLIGACAO || null,
        genero: row.DS_GENERO || null,
        ocupacao: row.DS_OCUPACAO || null,
        situacao_candidatura: row.DS_SITUACAO_CANDIDATURA || null,
        situacao_eleicao: row.DS_SIT_TOT_TURNO || null,
        eleito: /ELEITO/i.test(row.DS_SIT_TOT_TURNO || ""),
        cod_municipio_tse: row.SG_UE || null,
      };

    case "resultados":
      return {
        ano: ANO,
        uf: ufRow || UF,
        turno: Number(row.NR_TURNO || 1),
        cargo: row.DS_CARGO || "",
        cod_municipio_tse: row.CD_MUNICIPIO || null,
        zona: Number(row.NR_ZONA || 0),
        secao: Number(row.NR_SECAO || 0),
        numero_votavel: String(row.NR_VOTAVEL || ""),
        partido_sigla: row.SG_PARTIDO || null,
        votos: Number(row.QT_VOTOS || 0),
      };
  }
}

// ---------- Main ----------
async function run() {
  const url = buildUrl();
  console.log(`▶ Baixando: ${url}`);
  const res = await downloadStream(url);

  let buffer = [];
  let total = 0;
  const flush = async () => {
    if (buffer.length === 0) return;
    const r = await postChunk(buffer);
    total += r.inserted || buffer.length;
    console.log(`  ✓ Enviados ${total} registros`);
    buffer = [];
  };

  await pipeline(
    res,
    unzipper.Parse(),
    async function* (entries) {
      for await (const entry of entries) {
        if (!entry.path.toLowerCase().endsWith(".csv")) {
          entry.autodrain();
          continue;
        }
        // Filtro por UF no nome do arquivo, quando aplicável
        if (UF !== "BR" && /_[A-Z]{2}\.csv$/i.test(entry.path)) {
          if (!new RegExp(`_${UF}\\.csv$`, "i").test(entry.path)) {
            entry.autodrain();
            continue;
          }
        }
        console.log(`  📄 Processando ${entry.path}`);
        const parser = entry.pipe(
          parse({
            delimiter: ";",
            columns: true,
            relax_quotes: true,
            relax_column_count: true,
            skip_empty_lines: true,
            bom: true,
            encoding: "latin1",
          })
        );
        for await (const row of parser) {
          const mapped = mapRow(row);
          if (!mapped) continue;
          buffer.push(mapped);
          if (buffer.length >= CHUNK) await flush();
        }
      }
    }
  );

  await flush();
  console.log(`✅ Concluído. Total: ${total} registros para ${tabelaDestino()}`);
}

run().catch((e) => {
  console.error("❌ Falha:", e.message);
  process.exit(1);
});
