import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData } = await userClient.auth.getClaims(token);
    if (!claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub;

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cnt = async (table: string) => {
      const { count } = await admin.from(table).select("*", { count: "exact", head: true });
      return count ?? 0;
    };

    const [
      pessoas, pessoasSemContato, demandasAbertas, demandasAtrasadas,
      eventosFuturos, materiaisAtivos, campanhasAtivas, usuariosTotal,
      auditHoje,
    ] = await Promise.all([
      cnt("pessoas"),
      admin.from("pessoas").select("id", { count: "exact", head: true })
        .not("id", "in", `(select pessoa_id from pessoas_contatos)`)
        .then((r) => r.count ?? 0).catch(() => 0),
      admin.from("demandas").select("id", { count: "exact", head: true }).eq("status", "aberta").then((r) => r.count ?? 0),
      admin.from("demandas").select("id", { count: "exact", head: true })
        .lt("data_prazo", new Date().toISOString()).neq("status", "resolvida").then((r) => r.count ?? 0),
      admin.from("agenda").select("id", { count: "exact", head: true })
        .gte("data_inicio", new Date().toISOString()).then((r) => r.count ?? 0),
      admin.from("materiais").select("id", { count: "exact", head: true }).eq("ativo", true).then((r) => r.count ?? 0),
      admin.from("campanhas").select("id", { count: "exact", head: true }).eq("ativa", true).then((r) => r.count ?? 0),
      cnt("profiles"),
      admin.from("audit_logs").select("id", { count: "exact", head: true })
        .gte("created_at", new Date(new Date().setHours(0,0,0,0)).toISOString()).then((r) => r.count ?? 0),
    ]);

    return new Response(JSON.stringify({
      pessoas, pessoasSemContato, demandasAbertas, demandasAtrasadas,
      eventosFuturos, materiaisAtivos, campanhasAtivas, usuariosTotal, auditHoje,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
