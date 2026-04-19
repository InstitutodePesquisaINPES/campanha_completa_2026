// Edge Function: ibge-import-municipios-ba
// Importa população 2022, área, densidade, urbano% e pirâmide etária
// Suporta modo single (municipio_id) ou bulk (todos da BA).
// Idempotente.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Faixas etárias agregadas a partir das classes do Censo 2022 (tabela 9514, classificação c287)
// Códigos c287: 93070=0-4, 93084=5-9, ... 49108=100+
const FAIXAS: Array<{ label: string; min: number; max: number | null; codes: string[] }> = [
  { label: "0-4",   min: 0,   max: 4,   codes: ["93070"] },
  { label: "5-9",   min: 5,   max: 9,   codes: ["93084"] },
  { label: "10-14", min: 10,  max: 14,  codes: ["93085"] },
  { label: "15-19", min: 15,  max: 19,  codes: ["93086"] },
  { label: "20-29", min: 20,  max: 29,  codes: ["93087", "93088"] },
  { label: "30-39", min: 30,  max: 39,  codes: ["93089", "93090"] },
  { label: "40-49", min: 40,  max: 49,  codes: ["93091", "93092"] },
  { label: "50-59", min: 50,  max: 59,  codes: ["93093", "93094"] },
  { label: "60-69", min: 60,  max: 69,  codes: ["93095", "93096"] },
  { label: "70+",   min: 70,  max: null, codes: ["93097", "93098", "49108", "49109"] },
];

async function fetchJson(url: string, retries = 3): Promise<any> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "SIGT/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url.slice(0, 80)}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
    }
  }
  throw lastErr;
}

// Tabela 4709 var 93 = População; var 614 = Área; var 615 = Densidade
async function fetchBasicos(geocodigo: string) {
  const url = `https://apisidra.ibge.gov.br/values/t/4709/n6/${geocodigo}/v/93,614,615/p/2022`;
  const data = await fetchJson(url).catch(() => null);
  if (!Array.isArray(data) || data.length < 2) return {};
  const result: any = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const v = parseFloat(String(row?.V || "").replace(",", ".")) || null;
    if (row?.["D2C"] === "93")  result.populacao = v;
    if (row?.["D2C"] === "614") result.area_km2 = v;
    if (row?.["D2C"] === "615") result.densidade = v;
  }
  return result;
}

// Tabela 9514 = População por sexo e grupo de idade (Censo 2022)
// Sexo: c2 = 4 (Homens), 5 (Mulheres)
async function fetchPiramide(geocodigo: string) {
  const codes = FAIXAS.flatMap((f) => f.codes).join(",");
  const url = `https://apisidra.ibge.gov.br/values/t/9514/n6/${geocodigo}/v/93/p/2022/c2/4,5/c287/${codes}`;
  const data = await fetchJson(url).catch(() => null);
  if (!Array.isArray(data) || data.length < 2) return [];

  // mapeia c287 -> faixa
  const codeToFaixa = new Map<string, typeof FAIXAS[0]>();
  for (const f of FAIXAS) for (const c of f.codes) codeToFaixa.set(c, f);

  const acc = new Map<string, { faixa: typeof FAIXAS[0]; sexo: "M" | "F"; quantidade: number }>();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sexoCod = String(row?.["D4C"] || "");
    const faixaCod = String(row?.["D5C"] || "");
    const valor = parseInt(String(row?.V || "0").replace(/\D/g, ""), 10) || 0;
    const faixa = codeToFaixa.get(faixaCod);
    if (!faixa) continue;
    const sexo: "M" | "F" = sexoCod === "4" ? "M" : sexoCod === "5" ? "F" : ("M" as any);
    const k = `${faixa.label}-${sexo}`;
    const cur = acc.get(k) || { faixa, sexo, quantidade: 0 };
    cur.quantidade += valor;
    acc.set(k, cur);
  }
  return Array.from(acc.values());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const body = await req.json().catch(() => ({} as any));
  const { uf = "BA", municipio_id } = body;

  const { data: job } = await supabase
    .from("dados_externos_jobs")
    .insert({
      fonte: "IBGE",
      tipo: municipio_id ? "municipio_single" : "municipios",
      uf,
      municipio_id: municipio_id || null,
      status: "rodando",
      iniciado_em: new Date().toISOString(),
    })
    .select()
    .single();

  let processados = 0, atualizados = 0;
  const erros: string[] = [];

  try {
    // Lista alvo
    let q = supabase.from("municipios").select("id, nome, geocodigo_ibge").order("nome");
    if (municipio_id) q = q.eq("id", municipio_id);
    const { data: municipios = [] } = await q;

    if (!municipios || municipios.length === 0) {
      throw new Error("Nenhum município alvo encontrado");
    }

    console.log(`[IBGE] processando ${municipios.length} municípios`);

    for (const mun of municipios) {
      try {
        if (!mun.geocodigo_ibge) {
          erros.push(`${mun.nome}: sem geocódigo IBGE`);
          continue;
        }

        const basicos = await fetchBasicos(String(mun.geocodigo_ibge));
        const piramide = await fetchPiramide(String(mun.geocodigo_ibge));

        const updates: any = {
          ibge_atualizado_em: new Date().toISOString(),
          ano_referencia: 2022,
        };
        if (basicos.populacao) updates.populacao_2022 = Math.round(basicos.populacao);
        if (basicos.area_km2)  updates.area_km2 = basicos.area_km2;
        if (basicos.densidade) updates.densidade_hab_km2 = basicos.densidade;
        else if (basicos.populacao && basicos.area_km2) {
          updates.densidade_hab_km2 = basicos.populacao / basicos.area_km2;
        }

        await supabase.from("municipios").update(updates).eq("id", mun.id);

        // Pirâmide
        if (piramide.length > 0) {
          // limpa ano antes de reinserir (idempotente)
          await supabase.from("municipio_demografia")
            .delete()
            .eq("municipio_id", mun.id)
            .eq("ano", 2022);

          const rows = piramide.map((p) => ({
            municipio_id: mun.id,
            ano: 2022,
            faixa_etaria: p.faixa.label,
            faixa_min: p.faixa.min,
            faixa_max: p.faixa.max,
            sexo: p.sexo,
            quantidade: p.quantidade,
            fonte: "IBGE Censo 2022 - Tabela 9514",
          }));
          await supabase.from("municipio_demografia").insert(rows);
        }

        atualizados++;
        processados++;

        // Rate limit modo bulk
        if (!municipio_id && processados % 10 === 0) {
          await new Promise((r) => setTimeout(r, 800));
        }
      } catch (e: any) {
        erros.push(`${mun.nome}: ${e.message}`);
      }
    }

    await supabase.from("dados_externos_jobs").update({
      status: erros.length > 0 ? "parcial" : "sucesso",
      total_processados: processados,
      total_atualizados: atualizados,
      concluido_em: new Date().toISOString(),
      erro: erros.slice(0, 10).join("; ") || null,
    }).eq("id", job!.id);

    return new Response(
      JSON.stringify({ ok: true, processados, atualizados, erros: erros.length, detalhe_erros: erros.slice(0, 5) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    await supabase.from("dados_externos_jobs").update({
      status: "erro",
      erro: e.message,
      concluido_em: new Date().toISOString(),
    }).eq("id", job!.id);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
