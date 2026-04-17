// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIPOS = ["eleitorado", "locais", "candidatos", "resultados", "prestacao_contas"] as const;
type Tipo = typeof TIPOS[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userRes.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const body = await req.json();
    const uf = String(body.uf ?? "").toUpperCase();
    const anos: number[] = Array.isArray(body.anos) ? body.anos : [body.ano].filter(Boolean);
    const tipos: Tipo[] = (Array.isArray(body.tipos) && body.tipos.length ? body.tipos : TIPOS) as Tipo[];

    if (!uf || uf.length !== 2 || !anos.length) return json({ error: "uf e anos obrigatórios" }, 400);

    const rows: any[] = [];
    for (const ano of anos) {
      for (const tipo of tipos) {
        rows.push({
          tipo, uf, ano,
          status: "queued",
          created_by: userRes.user.id,
          source_url: buildSourceUrl(tipo, uf, ano),
        });
      }
    }

    const { data, error } = await admin.from("tse_import_jobs").insert(rows).select("id");
    if (error) throw error;

    return json({ enqueued: data.length, jobs: data.map((d) => d.id) });
  } catch (e: any) {
    return json({ error: e.message ?? String(e) }, 500);
  }
});

function buildSourceUrl(tipo: Tipo, uf: string, ano: number) {
  const base = "https://cdn.tse.jus.br/estatistica/sead/odsele";
  switch (tipo) {
    case "eleitorado": return `${base}/perfil_eleitorado_secao/perfil_eleitorado_secao_${ano}.zip`;
    case "locais": return `${base}/eleitorado_locais_votacao/eleitorado_local_votacao_${ano}.zip`;
    case "candidatos": return `${base}/consulta_cand/consulta_cand_${ano}.zip`;
    case "resultados": return `${base}/votacao_secao/votacao_secao_${ano}_${uf}.zip`;
    case "prestacao_contas": return `${base}/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_${ano}.zip`;
  }
}

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
