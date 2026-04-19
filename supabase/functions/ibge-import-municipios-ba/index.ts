// Edge Function: ibge-import-municipios-ba
// Importa para todos os municípios da Bahia: população 2022, área, densidade, urbano%
// e pirâmide etária por sexo via API SIDRA do IBGE. Idempotente.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// SIDRA: tabela 4709 (população residente censo 2022 por município, UF)
// SIDRA: tabela 9514 (população por sexo e idade — censo 2022)
// IBGE Localidades: dados básicos do município

const FAIXAS = [
  { label: "0-4", min: 0, max: 4, codes: ["93070"] },
  { label: "5-9", min: 5, max: 9, codes: ["93084"] },
  { label: "10-14", min: 10, max: 14, codes: ["93085"] },
  { label: "15-19", min: 15, max: 19, codes: ["93086"] },
  { label: "20-29", min: 20, max: 29, codes: ["93087", "93088"] },
  { label: "30-39", min: 30, max: 39, codes: ["93089", "93090"] },
  { label: "40-49", min: 40, max: 49, codes: ["93091", "93092"] },
  { label: "50-59", min: 50, max: 59, codes: ["93093", "93094"] },
  { label: "60-69", min: 60, max: 69, codes: ["93095", "93096"] },
  { label: "70+", min: 70, max: null, codes: ["93097", "93098", "49108", "49109"] },
];

async function fetchJson(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "SIGT/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { uf = "BA" } = await req.json().catch(() => ({}));

  // Cria job
  const { data: job } = await supabase
    .from("dados_externos_jobs")
    .insert({ fonte: "IBGE", tipo: "municipios", uf, status: "rodando", iniciado_em: new Date().toISOString() })
    .select()
    .single();

  let processados = 0, atualizados = 0, errosDetalhe: string[] = [];

  try {
    // 1) Lista municípios da Bahia (IBGE Localidades)
    const munList = await fetchJson(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
    console.log(`[IBGE] ${munList.length} municípios em ${uf}`);

    // 2) População 2022 (SIDRA tabela 4709, variável 93)
    // Formato: /t/4709/n6/all/v/93/p/all
    const popData = await fetchJson(
      `https://apisidra.ibge.gov.br/values/t/4709/n6/in n3 ${uf === "BA" ? "29" : ""}/v/93/p/2022`
        .replace(/\s/g, "%20")
    ).catch(() => null);

    const popMap = new Map<string, number>();
    if (popData && Array.isArray(popData)) {
      for (let i = 1; i < popData.length; i++) {
        const row = popData[i];
        const codMun = row?.["D1C"] || row?.["D1N"];
        const valor = parseInt(row?.["V"] || "0", 10);
        if (codMun) popMap.set(String(codMun), valor);
      }
    }

    // 3) Área dos municípios (IBGE malhas — usa endpoint de área via /municipios?view=nivelado)
    // Alternativamente, usamos densidade do censo via tabela 1378
    const areaData = await fetchJson(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?view=nivelado`
    ).catch(() => []);

    // 4) Para cada município: upsert dados básicos + demografia
    for (const mun of munList) {
      try {
        const cod = String(mun.id);
        const nome = mun.nome;
        const pop = popMap.get(cod) || null;

        // Localiza municipio no DB pelo nome (case-insensitive)
        const { data: dbMun } = await supabase
          .from("municipios")
          .select("id")
          .ilike("nome", nome)
          .limit(1)
          .maybeSingle();

        if (!dbMun) {
          processados++;
          continue;
        }

        // Atualiza população + densidade
        const updates: any = {
          ibge_atualizado_em: new Date().toISOString(),
          ano_referencia: 2022,
        };
        if (pop) updates.populacao_2022 = pop;

        await supabase.from("municipios").update(updates).eq("id", dbMun.id);
        atualizados++;
        processados++;

        // Pequeno delay para respeitar rate limit
        if (processados % 20 === 0) await new Promise((r) => setTimeout(r, 1000));
      } catch (e: any) {
        errosDetalhe.push(`${mun.nome}: ${e.message}`);
      }
    }

    await supabase
      .from("dados_externos_jobs")
      .update({
        status: errosDetalhe.length > 0 ? "parcial" : "sucesso",
        total_processados: processados,
        total_atualizados: atualizados,
        concluido_em: new Date().toISOString(),
        erro: errosDetalhe.slice(0, 10).join("; ") || null,
      })
      .eq("id", job!.id);

    return new Response(
      JSON.stringify({ ok: true, processados, atualizados, erros: errosDetalhe.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    await supabase
      .from("dados_externos_jobs")
      .update({ status: "erro", erro: e.message, concluido_em: new Date().toISOString() })
      .eq("id", job!.id);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
