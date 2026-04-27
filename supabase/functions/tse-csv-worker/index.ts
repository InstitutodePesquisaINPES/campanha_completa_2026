// Edge Function: tse-csv-worker
// Worker em background que processa CSVs do TSE arquivados no Storage.
// - Pega 1 arquivo em status 'aguardando' ou 'processando' por execução
// - Faz range download (5 MB por vez) do storage
// - Parseia CSV, mapeia para schema da tabela TSE, ingere em lotes de 500
// - Atualiza byte_cursor + linhas_processadas a cada lote (retomada exata)
// - Time budget de ~50s; se não acabar, sai mantendo status 'processando'
// - O cron pg_cron chama essa função a cada 1 min automaticamente
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { parse } from "npm:csv-parse@5.5.6/sync";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "tse-csv-uploads";
const RANGE_BYTES = 5 * 1024 * 1024; // 5MB por chunk de leitura
const TIME_BUDGET_MS = 50_000;
const SUBLOTE = 250;

type Tipo =
  | "eleitorado_perfil"
  | "votacao_candidato_perfil"
  | "eleitorado"
  | "locais"
  | "candidatos"
  | "resultados";

const TABELA_DESTINO: Record<Tipo, string> = {
  eleitorado_perfil: "tse_eleitorado_perfil",
  votacao_candidato_perfil: "tse_votacao_candidato_perfil",
  eleitorado: "tse_eleitorado",
  locais: "tse_locais_votacao",
  candidatos: "tse_candidatos",
  resultados: "tse_resultados_secao",
};

const ON_CONFLICT: Record<string, string | undefined> = {
  tse_eleitorado: "ano,uf,cod_municipio_tse,zona,secao",
  tse_locais_votacao: "ano,uf,cod_municipio_tse,zona,codigo_local",
  tse_resultados_secao: "ano,turno,uf,cod_municipio_tse,zona,secao,cargo,numero_votavel",
  tse_candidatos: "ano,turno,uf,cod_municipio_tse,cargo,numero_urna",
  tse_eleitorado_perfil: undefined,
  tse_votacao_candidato_perfil: undefined,
};

// ----- Detecção automática inteligente do tipo via header -----
function normKey(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function detectTipoFromHeader(headerLine: string): Tipo | null {
  const headers = headerLine.split(";").map((h) => h.replace(/^"|"$/g, "").trim());
  const H = new Set(headers.map(normKey));
  const has = (...ks: string[]) => ks.every((k) => H.has(normKey(k)));
  const hasAny = (...ks: string[]) => ks.some((k) => H.has(normKey(k)));

  if (has("Nome candidato", "Votos nominais") && hasAny("Cor/raça", "Faixa etária", "Gênero", "Grau de instrução"))
    return "votacao_candidato_perfil";
  if (hasAny("Quantidade de eleitores", "QT_ELEITORES_PERFIL", "QT_ELEITORES") && hasAny("Cor / Raça", "DS_COR_RACA", "Faixa etária", "DS_FAIXA_ETARIA", "Gênero", "DS_GENERO", "Grau de instrução", "DS_GRAU_ESCOLARIDADE"))
    return "eleitorado_perfil";
  if (hasAny("NM_LOCAL_VOTACAO", "DS_LOCAL_VOTACAO", "NR_LOCAL_VOTACAO")) return "locais";
  if (hasAny("NM_URNA_CANDIDATO", "NM_CANDIDATO") && hasAny("DS_CARGO", "CD_CARGO")) return "candidatos";
  if (hasAny("QT_VOTOS") && hasAny("NR_VOTAVEL")) return "resultados";
  if (hasAny("QT_ELEITORES_PERFIL", "QT_ELEITORES")) return "eleitorado";
  return null;
}

// ----- helpers de parse -----
function n(v: any): number | null {
  if (v === undefined || v === null || v === "" || v === "#NULO#" || v === "#NE#") return null;
  const x = Number(String(v).replace(",", "."));
  return Number.isFinite(x) ? x : null;
}
function s(v: any): string | null {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  if (!t || t === "#NULO#" || t === "#NE#") return null;
  return t;
}
function dateText(v: any): string | null {
  const t = s(v);
  if (!t) return null;
  const br = t.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return br ? `${br[3]}-${br[2]}-${br[1]}` : t;
}
function pick(row: any, ...keys: string[]): any {
  for (const k of keys) if (row[k] !== undefined) return row[k];
  const norm = (x: string) =>
    x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const wanted = keys.map(norm);
  for (const k of Object.keys(row)) if (wanted.includes(norm(k))) return row[k];
  return undefined;
}

function mapRow(tipo: Tipo, ano: number, uf: string, row: any): Record<string, any> | null {
  const ufRow = s(pick(row, "SG_UF", "UF")) || uf;
  if (uf !== "BR" && ufRow && ufRow !== uf) return null;

  switch (tipo) {
    case "eleitorado_perfil":
      return {
        ano: n(pick(row, "Ano de eleição", "Ano de eleicao", "ANO_ELEICAO")) ?? ano,
        uf: ufRow,
        regiao: s(pick(row, "Região", "Regiao")),
        municipio: s(pick(row, "Município", "Municipio", "NM_MUNICIPIO", "NM_UE")),
        pais: s(pick(row, "País", "Pais")),
        cor_raca: s(pick(row, "Cor / Raça", "Cor/Raça", "Cor / Raca", "Cor/Raca", "DS_COR_RACA")),
        estado_civil: s(pick(row, "Estado civil", "DS_ESTADO_CIVIL")),
        faixa_etaria: s(pick(row, "Faixa etária", "Faixa etaria", "DS_FAIXA_ETARIA")),
        genero: s(pick(row, "Gênero", "Genero", "DS_GENERO")),
        grau_instrucao: s(pick(row, "Grau de instrução", "Grau de instrucao", "DS_GRAU_ESCOLARIDADE")),
        identidade_genero: s(pick(row, "Identidade de gênero", "Identidade de genero", "DS_IDENTIDADE_GENERO")),
        interprete_libras: s(pick(row, "Intérprete de libras", "Interprete de libras", "DS_INTERPRETE_LIBRAS")),
        quilombola: s(pick(row, "Quilombola", "DS_QUILOMBOLA")),
        quantidade_eleitores: n(pick(row, "Quantidade de eleitores", "QT_ELEITORES_PERFIL", "QT_ELEITORES")) ?? 0,
        data_carga: dateText(pick(row, "Data de carga", "DT_GERACAO", "DT_CARGA")),
      };
    case "votacao_candidato_perfil":
      return {
        ano: n(pick(row, "Ano de eleição", "Ano de eleicao")) ?? ano,
        uf: ufRow,
        regiao: s(pick(row, "Região", "Regiao")),
        municipio: s(pick(row, "Município", "Municipio")),
        cod_municipio_tse: s(pick(row, "Código município", "Codigo municipio")),
        cargo: s(pick(row, "Cargo")) || "",
        nome_candidato: s(pick(row, "Nome candidato")),
        numero_candidato: s(pick(row, "Número candidato", "Numero candidato")),
        ocupacao: s(pick(row, "Ocupação", "Ocupacao")),
        partido: s(pick(row, "Partido")),
        situacao_totalizacao: s(pick(row, "Situação totalização", "Situacao totalizacao")),
        turno: n(pick(row, "Turno")) ?? 1,
        zona: n(pick(row, "Zona")),
        cor_raca: s(pick(row, "Cor/raça", "Cor / Raça", "Cor/raca")),
        estado_civil: s(pick(row, "Estado civil")),
        faixa_etaria: s(pick(row, "Faixa etária", "Faixa etaria")),
        genero: s(pick(row, "Gênero", "Genero")),
        grau_instrucao: s(pick(row, "Grau de instrução", "Grau de instrucao")),
        votos_validos: n(pick(row, "Votos válidos", "Votos validos")) ?? 0,
        votos_nominais: n(pick(row, "Votos nominais")) ?? 0,
        data_carga: s(pick(row, "Data de carga")),
      };
    case "eleitorado":
      return {
        ano,
        uf: ufRow,
        cod_municipio_tse: s(pick(row, "CD_MUNICIPIO", "CD_MUNIC_TSE")),
        zona: n(pick(row, "NR_ZONA")),
        secao: n(pick(row, "NR_SECAO")),
        total_eleitores: n(pick(row, "QT_ELEITORES_PERFIL", "QT_ELEITORES")) ?? 0,
      };
    case "locais":
      return {
        ano,
        uf: ufRow,
        cod_municipio_tse: s(pick(row, "CD_MUNICIPIO")),
        codigo_local:
          s(pick(row, "NR_LOCAL_VOTACAO")) || s(pick(row, "CD_LOCAL_VOTACAO")) || "",
        nome_local: s(pick(row, "NM_LOCAL_VOTACAO")),
        endereco: s(pick(row, "DS_ENDERECO")),
        bairro: s(pick(row, "NM_BAIRRO")),
        cep: s(pick(row, "NR_CEP")),
        zona: n(pick(row, "NR_ZONA")) ?? 0,
        latitude: n(pick(row, "NR_LATITUDE")),
        longitude: n(pick(row, "NR_LONGITUDE")),
      };
    case "candidatos":
      return {
        ano,
        uf: ufRow,
        turno: n(pick(row, "NR_TURNO")) ?? 1,
        cargo: s(pick(row, "DS_CARGO")) || s(pick(row, "CD_CARGO")) || "",
        numero_urna: s(pick(row, "NR_CANDIDATO")) || "",
        nome_urna: s(pick(row, "NM_URNA_CANDIDATO")),
        nome_completo: s(pick(row, "NM_CANDIDATO")),
        cpf: s(pick(row, "NR_CPF_CANDIDATO")),
        partido_sigla: s(pick(row, "SG_PARTIDO")),
        partido_numero: s(pick(row, "NR_PARTIDO")),
        coligacao: s(pick(row, "NM_COLIGACAO")),
        genero: s(pick(row, "DS_GENERO")),
        ocupacao: s(pick(row, "DS_OCUPACAO")),
        situacao_candidatura: s(pick(row, "DS_SITUACAO_CANDIDATURA")),
        situacao_eleicao: s(pick(row, "DS_SIT_TOT_TURNO")),
        eleito: /ELEITO/i.test(s(pick(row, "DS_SIT_TOT_TURNO")) || ""),
        cod_municipio_tse: s(pick(row, "SG_UE")),
      };
    case "resultados":
      return {
        ano,
        uf: ufRow,
        turno: n(pick(row, "NR_TURNO")) ?? 1,
        cargo: s(pick(row, "DS_CARGO")) || "",
        cod_municipio_tse: s(pick(row, "CD_MUNICIPIO")),
        zona: n(pick(row, "NR_ZONA")) ?? 0,
        secao: n(pick(row, "NR_SECAO")) ?? 0,
        numero_votavel: s(pick(row, "NR_VOTAVEL")) || "",
        partido_sigla: s(pick(row, "SG_PARTIDO")),
        votos: n(pick(row, "QT_VOTOS")) ?? 0,
      };
  }
  return null;
}

function matchMunicipio(row: any, filtro: string[] | null): boolean {
  if (!filtro || filtro.length === 0) return true;
  const codigo = String(
    pick(row, "CD_MUNICIPIO", "CD_MUNIC_TSE", "Código município", "Codigo municipio", "SG_UE") ?? "",
  ).trim();
  const nome = String(
    pick(row, "NM_MUNICIPIO", "Município", "Municipio", "NM_UE") ?? "",
  ).trim();
  return filtro.includes(codigo) || filtro.includes(nome);
}

// ISO-8859-1 (latin1) decoder — TSE usa essa codificação
const decoder = new TextDecoder("iso-8859-1");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE);

  const t0 = Date.now();
  const timeLeft = () => TIME_BUDGET_MS - (Date.now() - t0);
  let arquivoAtual: any = null;

  try {
    // 1) Pega 1 arquivo pendente (FIFO)
    const { data: arquivos, error: e1 } = await admin
      .from("tse_csv_arquivos")
      .select("*")
      .in("status", ["aguardando", "processando"])
      .order("created_at", { ascending: true })
      .limit(1);
    if (e1) throw e1;

    const arquivo = arquivos?.[0];
    arquivoAtual = arquivo;
    if (!arquivo) {
      return json({ ok: true, picked: 0, msg: "sem arquivos pendentes" });
    }

    // Marca como processando + incrementa attempts
    await admin
      .from("tse_csv_arquivos")
      .update({
        status: "processando",
        started_at: arquivo.started_at ?? new Date().toISOString(),
        ultima_atividade_em: new Date().toISOString(),
        attempts: (arquivo.attempts ?? 0) + 1,
        error_msg: null,
      })
      .eq("id", arquivo.id);

    let tipo = arquivo.tipo as Tipo;
    let tabela = arquivo.tabela_destino as string;
    let onConflict = ON_CONFLICT[tabela];

    // 2) Garante que temos o header (linha 1) salvo no registro
    const partsInfo = getPartsInfo(arquivo);
    let header = arquivo.header_line as string | null;
    if (!header) {
      const headBytes = await downloadRange(admin, partsInfo, 0, 64 * 1024 - 1);
      const headText = decoder.decode(headBytes);
      const idxNl = headText.indexOf("\n");
      if (idxNl < 0) throw new Error("CSV sem quebras de linha nos primeiros 64KB");
      header = headText.slice(0, idxNl).replace(/\r$/, "");
      const headerBytesLen = byteLengthLatin1(header) + 1;
      await admin
        .from("tse_csv_arquivos")
        .update({ header_line: header, byte_cursor: Math.max(arquivo.byte_cursor, headerBytesLen) })
        .eq("id", arquivo.id);
      arquivo.header_line = header;
      arquivo.byte_cursor = Math.max(arquivo.byte_cursor, headerBytesLen);
    }

    // 2.5) AUTO-DETECÇÃO INTELIGENTE: corrige tipo se usuário escolheu errado
    const tipoDetectado = detectTipoFromHeader(header);
    if (tipoDetectado && tipoDetectado !== tipo) {
      console.log(`[auto-detect] tipo informado=${tipo} → corrigido=${tipoDetectado}`);
      tipo = tipoDetectado;
      tabela = TABELA_DESTINO[tipo];
      onConflict = ON_CONFLICT[tabela];
      await admin
        .from("tse_csv_arquivos")
        .update({ tipo, tabela_destino: tabela })
        .eq("id", arquivo.id);
    }

    let cursor: number = arquivo.byte_cursor;
    let linhasProcessadas: number = arquivo.linhas_processadas ?? 0;
    let leftover = ""; // resíduo (linha incompleta) entre ranges
    let buffer: any[] = [];
    let totalInseridoSessao = 0;
    const filtro = (arquivo.municipios_filtro as string[] | null) ?? null;

    // 3) Loop de leitura por ranges
    while (timeLeft() > 5000) {
      if (cursor >= (arquivo.tamanho_bytes ?? Number.POSITIVE_INFINITY)) break;
      const end = cursor + RANGE_BYTES - 1;
      const bytes = await downloadRange(admin, partsInfo, cursor, end);
      if (bytes.byteLength === 0) break;
      // Mantém o cursor no início da linha incompleta e rebaixa essa linha no próximo range.
      // Não concatenamos leftover para não duplicar pedaços de linhas entre chunks.
      const text = decoder.decode(bytes);

      // separa em linhas; última pode estar incompleta -> guarda
      const lastNl = text.lastIndexOf("\n");
      const completePart = lastNl >= 0 ? text.slice(0, lastNl) : "";
      leftover = lastNl >= 0 ? text.slice(lastNl + 1) : text;

      if (completePart.length === 0) {
        cursor += bytes.byteLength;
        continue;
      }

      // Parseia este pedaço (header + linhas) — anexa header pra ter colunas nomeadas
      const csvBlock = header + "\n" + completePart;
      let rows: any[];
      try {
        rows = parse(csvBlock, {
          delimiter: ";",
          columns: true,
          relax_quotes: true,
          relax_column_count: true,
          skip_empty_lines: true,
          bom: true,
          trim: false,
        });
      } catch (err) {
        // erro de parse de bloco — sinaliza e para o arquivo
        await admin
          .from("tse_csv_arquivos")
          .update({
            status: "erro",
            error_msg: "parse: " + (err as Error).message,
            ultima_atividade_em: new Date().toISOString(),
          })
          .eq("id", arquivo.id);
        return json({ ok: false, error: "parse error", arquivo: arquivo.id });
      }

      for (const row of rows) {
        if (!matchMunicipio(row, filtro)) continue;
        const mapped = mapRow(tipo, arquivo.ano, arquivo.uf, row);
        if (!mapped) continue;
        buffer.push(mapped);
        if (buffer.length >= arquivo.chunk_size) {
          const ins = await flushBuffer(admin, tabela, buffer, onConflict);
          totalInseridoSessao += ins;
          linhasProcessadas += buffer.length;
          buffer = [];
        }
      }

      // avança cursor pelos bytes consumidos do range (apenas a parte completa)
      // Mais simples e correto: avançamos pela parte completa em bytes (sem o header que adicionamos manualmente)
      const advanceBytes = byteLengthLatin1(completePart) + 1; // +1 do \n final
      cursor += Math.min(bytes.byteLength, advanceBytes);
      // Garante progresso mínimo
      if (cursor <= arquivo.byte_cursor) cursor = arquivo.byte_cursor + bytes.byteLength;

      // Persiste cursor (a cada range) para poder retomar em queda
      const pct = arquivo.tamanho_bytes
        ? Math.min(99, Math.round((cursor / arquivo.tamanho_bytes) * 100))
        : 0;
      await admin
        .from("tse_csv_arquivos")
        .update({
          byte_cursor: cursor,
          linhas_processadas: linhasProcessadas,
          progress_pct: pct,
          ultima_atividade_em: new Date().toISOString(),
        })
        .eq("id", arquivo.id);
    }

    // Flush final dentro do budget
    if (buffer.length > 0 && timeLeft() > 3000) {
      const ins = await flushBuffer(admin, tabela, buffer, onConflict);
      totalInseridoSessao += ins;
      linhasProcessadas += buffer.length;
      buffer = [];
      await admin
        .from("tse_csv_arquivos")
        .update({
          linhas_processadas: linhasProcessadas,
          ultima_atividade_em: new Date().toISOString(),
        })
        .eq("id", arquivo.id);
    }

    // 4) Verifica se acabou
    const concluido =
      arquivo.tamanho_bytes != null && cursor >= arquivo.tamanho_bytes && buffer.length === 0;
    if (concluido) {
      await admin
        .from("tse_csv_arquivos")
        .update({
          status: "concluido",
          progress_pct: 100,
          finished_at: new Date().toISOString(),
          total_linhas: linhasProcessadas,
        })
        .eq("id", arquivo.id);
    }

    return json({
      ok: true,
      arquivo: arquivo.id,
      inserido_sessao: totalInseridoSessao,
      cursor,
      concluido,
      tempo_ms: Date.now() - t0,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("worker fatal:", msg);
    if (arquivoAtual?.id) {
      try {
        await createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
          .from("tse_csv_arquivos")
          .update({ status: "erro", error_msg: msg, ultima_atividade_em: new Date().toISOString() })
          .eq("id", arquivoAtual.id);
      } catch (_) {}
    }
    return json({ ok: false, error: msg }, 200);
  }
});

// Lista de partes do arquivo lógico. Quando upload em partes está ativo,
// o "arquivo" é a concatenação virtual de várias partes do storage.
type PartsInfo = { paths: string[]; sizes: number[] };

function getPartsInfo(arquivo: any): PartsInfo {
  const paths = Array.isArray(arquivo.parts_paths) && arquivo.parts_paths.length > 0
    ? (arquivo.parts_paths as string[])
    : [arquivo.storage_path as string];
  const sizes = Array.isArray(arquivo.parts_sizes) && arquivo.parts_sizes.length === paths.length
    ? (arquivo.parts_sizes as number[])
    : [arquivo.tamanho_bytes ?? 0];
  return { paths, sizes };
}

async function downloadRange(
  admin: any,
  pathOrParts: string | PartsInfo,
  start: number,
  end: number,
): Promise<Uint8Array> {
  // Modo legado: 1 único objeto
  if (typeof pathOrParts === "string") {
    return await downloadOneRange(admin, pathOrParts, start, end);
  }
  const { paths, sizes } = pathOrParts;

  // Mapeia [start..end] global em sub-ranges por parte
  const chunks: Uint8Array[] = [];
  let cursor = 0;
  for (let i = 0; i < paths.length; i++) {
    const partStart = cursor;
    const partEnd = cursor + sizes[i] - 1;
    cursor = partEnd + 1;
    if (partEnd < start) continue; // ainda não chegamos
    if (partStart > end) break;    // já passamos

    const localStart = Math.max(0, start - partStart);
    const localEnd = Math.min(sizes[i] - 1, end - partStart);
    const buf = await downloadOneRange(admin, paths[i], localStart, localEnd);
    chunks.push(buf);
  }
  if (chunks.length === 0) return new Uint8Array();
  if (chunks.length === 1) return chunks[0];
  // Concatena
  const total = chunks.reduce((a, b) => a + b.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.byteLength; }
  return out;
}

async function downloadOneRange(
  admin: any,
  path: string,
  start: number,
  end: number,
): Promise<Uint8Array> {
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 120);
  if (error) throw error;
  const res = await fetch(data.signedUrl, {
    headers: { Range: `bytes=${start}-${end}` },
  });
  if (!res.ok && res.status !== 206 && res.status !== 200) {
    throw new Error(`storage range ${start}-${end} (${path}): HTTP ${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

function byteLengthLatin1(s: string): number {
  // latin1 = 1 byte por code unit
  return s.length;
}

async function flushBuffer(
  admin: any,
  tabela: string,
  registros: any[],
  onConflict?: string,
): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < registros.length; i += SUBLOTE) {
    const slice = registros.slice(i, i + SUBLOTE);
    let attempt = 0;
    while (attempt < 4) {
      const q = onConflict
        ? admin.from(tabela).upsert(slice, { onConflict, ignoreDuplicates: true })
        : admin.from(tabela).insert(slice);
      const { error } = await q;
      if (!error) {
        inserted += slice.length;
        break;
      }
      const msg = error.message || "";
      if (/duplicate key|unique constraint/i.test(msg)) {
        inserted += slice.length;
        break;
      }
      if (!/deadlock|timeout|connection|temporarily/i.test(msg) || attempt >= 3) {
        throw new Error("ingest: " + msg);
      }
      attempt++;
      await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt)));
    }
  }
  return inserted;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
