// Edge Function: osm-import-bairros-ba
// Importa bairros via Overpass API. Modo single (síncrono) ou bulk (background).

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const URBANO_TAGS = ["neighbourhood", "suburb", "quarter", "city_block", "town"];
const RURAL_TAGS = ["village", "hamlet", "isolated_dwelling", "farm"];

async function overpassQuery(query: string, retries = 2): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 30000);
      const res = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain", "User-Agent": "SIGT/1.0" },
        body: query,
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.status === 429 || res.status === 504) throw new Error(`Rate ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  }
}

async function processMunicipio(supabase: any, mun: { id: string; nome: string }) {
  const query = `
    [out:json][timeout:45];
    area["name"="${mun.nome.replace(/"/g, '\\"')}"]["admin_level"="8"]->.a;
    (
      node(area.a)["place"];
      relation(area.a)["place"];
    );
    out center tags;
  `;
  const result = await overpassQuery(query);
  const elements = result?.elements || [];
  let inseridos = 0, atualizados = 0;

  for (const el of elements) {
    const tag = el.tags?.place;
    const nome = el.tags?.name;
    if (!nome || !tag) continue;

    const zona: "urbano" | "rural" | "misto" =
      URBANO_TAGS.includes(tag) ? "urbano" :
      RURAL_TAGS.includes(tag) ? "rural" : "misto";

    const lat = el.lat || el.center?.lat;
    const lon = el.lon || el.center?.lon;

    const { data: existing } = await supabase
      .from("bairros")
      .select("id")
      .eq("municipio_id", mun.id)
      .ilike("nome", nome)
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase.from("bairros").update({
        latitude: lat, longitude: lon, zona_tipo: zona,
        osm_id: el.id, osm_atualizado_em: new Date().toISOString(),
      }).eq("id", existing.id);
      atualizados++;
    } else {
      await supabase.from("bairros").insert({
        municipio_id: mun.id, nome, latitude: lat, longitude: lon,
        zona_tipo: zona, osm_id: el.id, osm_atualizado_em: new Date().toISOString(),
      });
      inseridos++;
    }
  }
  return { inseridos, atualizados, total: elements.length };
}

async function getEstadoIdByUF(supabase: any, uf: string) {
  const { data } = await supabase.from("estados").select("id").eq("sigla", uf).maybeSingle();
  return data?.id ?? null;
}

async function listMunicipiosPendentes(supabase: any, uf: string) {
  const estadoId = await getEstadoIdByUF(supabase, uf);
  let query = supabase
    .from("municipios")
    .select("id, nome, bairros!left(osm_atualizado_em)")
    .order("nome");
  if (estadoId) query = query.eq("estado_id", estadoId);

  const { data = [] } = await query;
  return (data || []).filter((m: any) => {
    const bairros = Array.isArray(m.bairros) ? m.bairros : [];
    return bairros.length === 0 || !bairros.some((b: any) => !!b.osm_atualizado_em);
  }).map((m: any) => ({ id: m.id, nome: m.nome }));
}

async function processBulk(jobId: string, uf: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const list = await listMunicipiosPendentes(supabase, uf);
  let processados = 0, inseridos = 0, atualizados = 0;
  const erros: string[] = [];

  if (list.length === 0) {
    await supabase.from("dados_externos_jobs").update({
      status: "sucesso",
      total_processados: 0,
      total_inseridos: 0,
      total_atualizados: 0,
      concluido_em: new Date().toISOString(),
      erro: null,
    }).eq("id", jobId);
    return;
  }

  for (const mun of list) {
    try {
      const r = await processMunicipio(supabase, mun as any);
      inseridos += r.inseridos;
      atualizados += r.atualizados;
      processados++;
    } catch (e: any) {
      erros.push(`${(mun as any).nome}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 1500));

    if (processados % 5 === 0) {
      await supabase.from("dados_externos_jobs").update({
        total_processados: processados,
        total_inseridos: inseridos,
        total_atualizados: atualizados,
      }).eq("id", jobId);
    }
  }

  await supabase.from("dados_externos_jobs").update({
    status: erros.length > 0 ? (processados > 0 ? "parcial" : "erro") : "sucesso",
    total_processados: processados,
    total_inseridos: inseridos,
    total_atualizados: atualizados,
    concluido_em: new Date().toISOString(),
    erro: erros.slice(0, 10).join("; ") || null,
  }).eq("id", jobId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { municipio_id, uf = "BA" } = await req.json().catch(() => ({}));

  if (municipio_id) {
    const { data: job } = await supabase.from("dados_externos_jobs").insert({
      fonte: "OSM", tipo: "bairros_single", uf, municipio_id,
      status: "rodando", iniciado_em: new Date().toISOString(),
    }).select().single();

    try {
      const { data: mun } = await supabase
        .from("municipios").select("id, nome").eq("id", municipio_id).single();
      if (!mun) throw new Error("Município não encontrado");

      const r = await processMunicipio(supabase, mun as any);

      await supabase.from("dados_externos_jobs").update({
        status: "sucesso",
        total_processados: r.total,
        total_inseridos: r.inseridos,
        total_atualizados: r.atualizados,
        concluido_em: new Date().toISOString(),
      }).eq("id", job!.id);

      return new Response(JSON.stringify({ ok: true, modo: "single", ...r, municipio: (mun as any).nome }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e: any) {
      await supabase.from("dados_externos_jobs").update({
        status: "erro", erro: e.message, concluido_em: new Date().toISOString(),
      }).eq("id", job!.id);
      return new Response(JSON.stringify({ ok: false, error: e.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const { data: runningJob } = await supabase
    .from("dados_externos_jobs")
    .select("id")
    .eq("fonte", "OSM")
    .eq("tipo", "bairros")
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
        mensagem: "Já existe uma importação OSM em andamento para esta UF.",
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
        mensagem: "Todos os municípios desta UF já possuem bairros OSM importados.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: job } = await supabase.from("dados_externos_jobs").insert({
    fonte: "OSM", tipo: "bairros", uf,
    status: "rodando", iniciado_em: new Date().toISOString(),
  }).select().single();

  // @ts-ignore
  EdgeRuntime.waitUntil(processBulk(job!.id, uf));

  return new Response(
    JSON.stringify({
      ok: true, modo: "bulk_background", job_id: job!.id, pendentes: pendentes.length,
      mensagem: "Importação OSM incremental iniciada em background. Ela continuará apenas os municípios pendentes.",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
