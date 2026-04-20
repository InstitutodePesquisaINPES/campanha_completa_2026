// Edge Function: tse-ingest-chunk
// Recebe lotes de registros do worker externo (GitHub Actions) e faz upsert.
// Autenticação via header X-Ingest-Token (compara com secret TSE_INGEST_TOKEN).
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ingest-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Tabela =
  | "tse_eleitorado"
  | "tse_locais_votacao"
  | "tse_candidatos"
  | "tse_resultados_secao"
  | "tse_prestacao_contas";

interface Payload {
  tabela: Tabela;
  registros: Record<string, unknown>[];
  truncate_filter?: { ano: number; uf: string };
  job_id?: string;
  reset_existing?: boolean;
}

const ALLOWED: Tabela[] = [
  "tse_eleitorado",
  "tse_locais_votacao",
  "tse_candidatos",
  "tse_resultados_secao",
  "tse_prestacao_contas",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = req.headers.get("x-ingest-token");
    const expected = Deno.env.get("TSE_INGEST_TOKEN");
    if (!expected || token !== expected) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = (await req.json()) as Payload;
    if (!ALLOWED.includes(body.tabela)) return json({ error: "tabela inválida" }, 400);
    if (!Array.isArray(body.registros)) return json({ error: "registros deve ser array" }, 400);

    if (body.reset_existing && body.truncate_filter) {
      const { ano, uf } = body.truncate_filter;
      const { error: delErr } = await supabase
        .from(body.tabela)
        .delete()
        .eq("ano", ano)
        .eq("uf", uf);
      if (delErr) console.error("delete error:", delErr.message);
    }

    if (body.registros.length === 0) {
      return json({ ok: true, inserted: 0 });
    }

    const SUBLOTE = 250;
    let inserted = 0;
    const isTransient = (msg: string) =>
      /deadlock detected|could not serialize|lock timeout|timeout|temporarily unavailable|connection/i.test(msg);

    for (let i = 0; i < body.registros.length; i += SUBLOTE) {
      const slice = body.registros.slice(i, i + SUBLOTE);
      let attempt = 0;
      let lastErr = "";
      while (attempt < 4) {
        const { error } = await supabase.from(body.tabela).insert(slice);
        if (!error) { lastErr = ""; break; }
        lastErr = error.message;
        if (!isTransient(lastErr)) {
          console.error("insert error (fatal):", lastErr);
          return json({ error: lastErr, inserted, retry: false }, 200);
        }
        attempt++;
        const wait = 200 * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
        console.warn(`transient error (attempt ${attempt}): ${lastErr} — retry in ${wait}ms`);
        await new Promise((r) => setTimeout(r, wait));
      }
      if (lastErr) {
        return json({ error: lastErr, inserted, retry: true }, 200);
      }
      inserted += slice.length;
    }

    if (body.job_id) {
      await supabase.from("tse_import_logs").insert({
        job_id: body.job_id,
        level: "info",
        message: `Chunk recebido: ${inserted} registros em ${body.tabela}`,
      });
    }

    return json({ ok: true, inserted });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(msg);
    return json({ error: msg, retry: /deadlock|timeout|connection/i.test(msg) }, 200);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
