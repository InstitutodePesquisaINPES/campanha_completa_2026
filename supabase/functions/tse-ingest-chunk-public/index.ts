// Edge Function: tse-ingest-chunk-public
// Versão autenticada via JWT (chamada do app via supabase.functions.invoke).
// Apenas usuários com role 'admin' podem usar.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Tabela =
  | "tse_eleitorado"
  | "tse_locais_votacao"
  | "tse_candidatos"
  | "tse_resultados_secao"
  | "tse_prestacao_contas"
  | "tse_eleitorado_perfil"
  | "tse_votacao_candidato_perfil";

const ALLOWED: Tabela[] = [
  "tse_eleitorado",
  "tse_locais_votacao",
  "tse_candidatos",
  "tse_resultados_secao",
  "tse_prestacao_contas",
  "tse_eleitorado_perfil",
  "tse_votacao_candidato_perfil",
];

interface Payload {
  tabela: Tabela;
  registros: Record<string, unknown>[];
  truncate_filter?: { ano: number; uf: string };
  reset_existing?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing auth" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) return json({ error: "forbidden: admin only" }, 403);

    const body = (await req.json()) as Payload;
    if (!ALLOWED.includes(body.tabela)) return json({ error: "tabela inválida" }, 400);
    if (!Array.isArray(body.registros)) return json({ error: "registros deve ser array" }, 400);

    if (body.reset_existing && body.truncate_filter) {
      const { ano, uf } = body.truncate_filter;
      const { error: delErr } = await admin
        .from(body.tabela)
        .delete()
        .eq("ano", ano)
        .eq("uf", uf);
      if (delErr) console.error("delete error:", delErr.message);
    }

    if (body.registros.length === 0) return json({ ok: true, inserted: 0 });

    const ON_CONFLICT: Record<Tabela, string | undefined> = {
      tse_eleitorado: "ano,uf,cod_municipio_tse,zona,secao",
      tse_locais_votacao: "ano,uf,zona,codigo_local",
      tse_resultados_secao: "ano,turno,uf,cod_municipio_tse,zona,secao,cargo,numero_votavel",
      tse_candidatos: undefined,
      tse_prestacao_contas: undefined,
      // Tabelas de perfil têm índice único por expressão (COALESCE) — usamos insert + tratamento de duplicate key
      tse_eleitorado_perfil: undefined,
      tse_votacao_candidato_perfil: undefined,
    };

    const SUBLOTE = 250;
    let inserted = 0;
    const onConflict = ON_CONFLICT[body.tabela];

    const isTransient = (msg: string) =>
      /deadlock detected|could not serialize|lock timeout|timeout|temporarily unavailable|connection/i.test(msg);
    const isDuplicate = (msg: string) =>
      /duplicate key value|unique constraint/i.test(msg);

    for (let i = 0; i < body.registros.length; i += SUBLOTE) {
      const slice = body.registros.slice(i, i + SUBLOTE);
      let attempt = 0;
      let lastErr = "";
      while (attempt < 4) {
        const query = onConflict
          ? admin.from(body.tabela).upsert(slice, { onConflict, ignoreDuplicates: true })
          : admin.from(body.tabela).insert(slice);
        const { error } = await query;
        if (!error) { lastErr = ""; break; }
        lastErr = error.message;
        // Duplicate key = já importado, ignora silenciosamente
        if (isDuplicate(lastErr)) { lastErr = ""; break; }
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
        // Sinaliza ao client para reenviar este chunk
        return json({ error: lastErr, inserted, retry: true }, 200);
      }
      inserted += slice.length;
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
