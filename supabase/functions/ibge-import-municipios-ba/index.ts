// Edge Function: ibge-import-municipios-ba
// Importa população 2022, área, densidade e pirâmide etária do IBGE.
// Modo single (rápido, síncrono) ou bulk (background, processa todos da BA em paralelo controlado).

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Faixas etárias agregadas (Censo 2022, tabela 9514, classificação c287)
const FAIXAS: Array<{ label: string; min: number; max: number | null; codes: string[] }> = [
  { label: "0-4",   min: 0,  max: 4,    codes: ["93070"] },
  { label: "5-9",   min: 5,  max: 9,    codes: ["93084"] },
  { label: "10-14", min: 10, max: 14,   codes: ["93085"] },
  { label: "15-19", min: 15, max: 19,   codes: ["93086"] },
  { label: "20-29", min: 20, max: 29,   codes: ["93087", "93088"] },
  { label: "30-39", min: 30, max: 39,   codes: ["93089", "93090"] },
  { label: "40-49", min: 40, max: 49,   codes: ["93091", "93092"] },
  { label: "50-59", min: 50, max: 59,   codes: ["93093", "93094"] },
  { label: "60-69", min: 60, max: 69,   codes: ["93095", "93096"] },
  { label: "70+",   min: 70, max: null, codes: ["93097", "93098", "49108", "49109"] },
];

async function fetchJson(url: string, retries = 2): Promise<any> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(url, { headers: { "User-Agent": "SIGT/1.0" }, signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 800));
    }
  }
  throw lastErr;
}

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

async function fetchPiramide(geocodigo: string) {
  const codes = FAIXAS.flatMap((f) => f.codes).join(",");
  const url = `https://apisidra.ibge.gov.br/values/t/9514/n6/${geocodigo}/v/93/p/2022/c2/4,5/c287/${codes}`;
  const data = await fetchJson(url).catch(() => null);
  if (!Array.isArray(data) || data.length < 2) return [];

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
    const sexo: "M" | "F" = sexoCod === "4" ? "M" : sexoCod === "5" ? "F" : "M";
    const k = `${faixa.label}-${sexo}`;
    const cur = acc.get(k) || { faixa, sexo, quantidade: 0 };
    cur.quantidade += valor;
    acc.set(k, cur);
  }
  return Array.from(acc.values());
}

async function processMunicipio(supabase: any, mun: { id: string; nome: string; geocodigo_ibge: string }) {
  if (!mun.geocodigo_ibge) throw new Error("sem geocódigo");

  const [basicos, piramide] = await Promise.all([
    fetchBasicos(String(mun.geocodigo_ibge)),
    fetchPiramide(String(mun.geocodigo_ibge)),
  ]);

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

  if (piramide.length > 0) {
    await supabase.from("municipio_demografia").delete().eq("municipio_id", mun.id).eq("ano", 2022);
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
}

async function getEstadoIdByUF(supabase: any, uf: string) {
  const { data } = await supabase.from("estados").select("id").eq("sigla", uf).maybeSingle();
  return data?.id ?? null;
}

async function listMunicipiosDoUF(supabase: any, uf: string) {
  const estadoId = await getEstadoIdByUF(supabase, uf);
  let query = supabase.from("municipios").select("id, nome, geocodigo_ibge, ibge_atualizado_em").order("nome");
  if (estadoId) query = query.eq("estado_id", estadoId);
  const { data = [] } = await query;
  return (data || []) as Array<{ id: string; nome: string; geocodigo_ibge: string | null; ibge_atualizado_em?: string | null }>;
}

async function listMunicipiosPendentes(supabase: any, uf: string) {
  const municipios = await listMunicipiosDoUF(supabase, uf);
  return municipios.filter((m) => !!m.geocodigo_ibge && !m.ibge_atualizado_em);
}

// Executa em background, processando apenas pendências com concorrência limitada
async function processBulk(jobId: string, uf: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const list = await listMunicipiosPendentes(supabase, uf);
  let processados = 0, atualizados = 0;
  const erros: string[] = [];
  const CONCURRENCY = 3;

  if (list.length === 0) {
    await supabase.from("dados_externos_jobs").update({
      status: "sucesso",
      total_processados: 0,
      total_atualizados: 0,
      concluido_em: new Date().toISOString(),
      erro: null,
    }).eq("id", jobId);
    return;
  }

  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const batch = list.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((m) => processMunicipio(supabase, m as any))
    );
    results.forEach((r, idx) => {
      processados++;
      if (r.status === "fulfilled") atualizados++;
      else erros.push(`${batch[idx].nome}: ${r.reason?.message || r.reason}`);
    });

    await supabase.from("dados_externos_jobs").update({
      total_processados: processados,
      total_atualizados: atualizados,
    }).eq("id", jobId);
  }

  await supabase.from("dados_externos_jobs").update({
    status: erros.length > 0 ? (atualizados > 0 ? "parcial" : "erro") : "sucesso",
    total_processados: processados,
    total_atualizados: atualizados,
    concluido_em: new Date().toISOString(),
    erro: erros.slice(0, 10).join("; ") || null,
  }).eq("id", jobId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const body = await req.json().catch(() => ({} as any));
  const { uf = "BA", municipio_id } = body;

  if (municipio_id) {
    const { data: job } = await supabase
      .from("dados_externos_jobs")
      .insert({
        fonte: "IBGE",
        tipo: "municipio_single",
        uf,
        municipio_id,
        status: "rodando",
        iniciado_em: new Date().toISOString(),
      })
      .select()
      .single();

    try {
      const { data: mun } = await supabase
        .from("municipios")
        .select("id, nome, geocodigo_ibge")
        .eq("id", municipio_id)
        .single();

      if (!mun) throw new Error("Município não encontrado");
      await processMunicipio(supabase, mun as any);

      await supabase.from("dados_externos_jobs").update({
        status: "sucesso",
        total_processados: 1,
        total_atualizados: 1,
        concluido_em: new Date().toISOString(),
      }).eq("id", job!.id);

      return new Response(
        JSON.stringify({ ok: true, modo: "single", municipio: (mun as any).nome }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e: any) {
      await supabase.from("dados_externos_jobs").update({
        status: "erro",
        erro: e.message,
        concluido_em: new Date().toISOString(),
      }).eq("id", job!.id);
      return new Response(JSON.stringify({ ok: false, error: e.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const { data: runningJob } = await supabase
    .from("dados_externos_jobs")
    .select("id")
    .eq("fonte", "IBGE")
    .eq("tipo", "municipios")
    .eq("uf", uf)
    .eq("status", "rodando")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (runningJob) {
    return new Response(
      JSON.stringify({
        ok: true,
        modo: "bulk_background",
        job_id: runningJob.id,
        resumed: true,
        mensagem: "Já existe uma importação IBGE em andamento para esta UF.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const pendentes = await listMunicipiosPendentes(supabase, uf);
  if (pendentes.length === 0) {
    return new Response(
      JSON.stringify({
        ok: true,
        modo: "bulk_background",
        ja_concluido: true,
        mensagem: "Todos os municípios desta UF já possuem dados IBGE importados.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: job } = await supabase
    .from("dados_externos_jobs")
    .insert({
      fonte: "IBGE",
      tipo: "municipios",
      uf,
      status: "rodando",
      iniciado_em: new Date().toISOString(),
    })
    .select()
    .single();

  // @ts-ignore EdgeRuntime existe no runtime Supabase
  EdgeRuntime.waitUntil(processBulk(job!.id, uf));

  return new Response(
    JSON.stringify({
      ok: true,
      modo: "bulk_background",
      job_id: job!.id,
      pendentes: pendentes.length,
      mensagem: "Importação incremental iniciada em background. Ela continuará apenas os municípios pendentes.",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
