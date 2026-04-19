// Edge Function: osm-import-bairros-ba
// Importa bairros (place=neighbourhood/suburb/quarter/village/hamlet) via Overpass API
// para todos municípios da Bahia. Classifica zona urbano/rural pelo tag `place=`.
// Rate limit: 1 request a cada 2s para respeitar Overpass.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const URBANO_TAGS = ["neighbourhood", "suburb", "quarter", "city_block", "town"];
const RURAL_TAGS = ["village", "hamlet", "isolated_dwelling", "farm"];

async function overpassQuery(query: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain", "User-Agent": "SIGT/1.0" },
        body: query,
      });
      if (res.status === 429 || res.status === 504) throw new Error(`Rate limited (${res.status})`);
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 5000 * (i + 1)));
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { municipio_id } = await req.json().catch(() => ({}));

  const { data: job } = await supabase
    .from("dados_externos_jobs")
    .insert({
      fonte: "OSM",
      tipo: "bairros",
      uf: "BA",
      municipio_id: municipio_id || null,
      status: "rodando",
      iniciado_em: new Date().toISOString(),
    })
    .select()
    .single();

  let processados = 0, inseridos = 0, atualizados = 0;
  const erros: string[] = [];

  try {
    // Lista municípios alvo
    let q = supabase.from("municipios").select("id, nome").order("nome");
    if (municipio_id) q = q.eq("id", municipio_id);
    const { data: municipios = [] } = await q;

    for (const mun of municipios!) {
      try {
        const query = `
          [out:json][timeout:60];
          area["name"="${mun.nome.replace(/"/g, '\\"')}"]["admin_level"="8"]->.a;
          (
            node(area.a)["place"];
            relation(area.a)["place"];
          );
          out center tags;
        `;
        const result = await overpassQuery(query);
        const elements = result?.elements || [];

        for (const el of elements) {
          const tag = el.tags?.place;
          const nome = el.tags?.name;
          if (!nome || !tag) continue;

          const zona: "urbano" | "rural" | "misto" =
            URBANO_TAGS.includes(tag) ? "urbano" :
            RURAL_TAGS.includes(tag) ? "rural" : "misto";

          const lat = el.lat || el.center?.lat;
          const lon = el.lon || el.center?.lon;

          // Upsert por (municipio, nome)
          const { data: existing } = await supabase
            .from("bairros")
            .select("id")
            .eq("municipio_id", mun.id)
            .ilike("nome", nome)
            .limit(1)
            .maybeSingle();

          if (existing) {
            await supabase.from("bairros").update({
              latitude: lat,
              longitude: lon,
              zona_tipo: zona,
              osm_id: el.id,
              osm_atualizado_em: new Date().toISOString(),
            }).eq("id", existing.id);
            atualizados++;
          } else {
            await supabase.from("bairros").insert({
              municipio_id: mun.id,
              nome,
              latitude: lat,
              longitude: lon,
              zona_tipo: zona,
              osm_id: el.id,
              osm_atualizado_em: new Date().toISOString(),
            });
            inseridos++;
          }
          processados++;
        }

        // Rate limit: 1 req / 2s
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e: any) {
        erros.push(`${mun.nome}: ${e.message}`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    await supabase.from("dados_externos_jobs").update({
      status: erros.length > 0 ? "parcial" : "sucesso",
      total_processados: processados,
      total_inseridos: inseridos,
      total_atualizados: atualizados,
      concluido_em: new Date().toISOString(),
      erro: erros.slice(0, 10).join("; ") || null,
    }).eq("id", job!.id);

    return new Response(
      JSON.stringify({ ok: true, processados, inseridos, atualizados, erros: erros.length }),
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
