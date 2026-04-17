// deno-lint-ignore-file no-explicit-any
// Bootstrap idempotente: enfileira pacote completo de eleitorado + locais da Bahia
// para 2024 e 2022 e dispara o worker. Pode ser chamado sem login (idempotente).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN: { tipo: string; ano: number; url: string }[] = [
  { tipo: "eleitorado", ano: 2024, url: "https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado_secao/perfil_eleitorado_secao_2024.zip" },
  { tipo: "locais",     ano: 2024, url: "https://cdn.tse.jus.br/estatistica/sead/odsele/eleitorado_locais_votacao/eleitorado_local_votacao_2024.zip" },
  { tipo: "eleitorado", ano: 2022, url: "https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado_secao/perfil_eleitorado_secao_2022.zip" },
  { tipo: "locais",     ano: 2022, url: "https://cdn.tse.jus.br/estatistica/sead/odsele/eleitorado_locais_votacao/eleitorado_local_votacao_2022.zip" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Busca jobs BA já existentes (queued/running/done) para os anos do plano
    const { data: existing } = await admin
      .from("tse_import_jobs")
      .select("tipo,ano,status")
      .eq("uf", "BA")
      .in("ano", [...new Set(PLAN.map((p) => p.ano))]);

    const seen = new Set(
      (existing ?? [])
        .filter((e: any) => ["queued", "running", "done"].includes(e.status))
        .map((e: any) => `${e.tipo}-${e.ano}`),
    );

    const toInsert = PLAN.filter((p) => !seen.has(`${p.tipo}-${p.ano}`)).map((p) => ({
      tipo: p.tipo,
      uf: "BA",
      ano: p.ano,
      status: "queued",
      source_url: p.url,
    }));

    let enqueued = 0;
    if (toInsert.length) {
      const { data, error } = await admin.from("tse_import_jobs").insert(toInsert).select("id");
      if (error) throw error;
      enqueued = data?.length ?? 0;
    }

    // Dispara o worker (fire-and-forget)
    let workerStarted = false;
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/tse-import-worker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_KEY}`,
          apikey: SERVICE_KEY,
        },
        body: "{}",
      });
      workerStarted = r.ok;
      await r.text();
    } catch (_) { /* ignore */ }

    return json({
      ok: true,
      enqueued,
      already_present: PLAN.length - toInsert.length,
      worker_started: workerStarted,
    });
  } catch (e: any) {
    return json({ error: e.message ?? String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
