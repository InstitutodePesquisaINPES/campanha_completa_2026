// Testa conexão com provedor de IA cadastrado
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (!roles?.some(r => r.role === "admin")) return json({ error: "Apenas admin" }, 403);

    const { provedor_id } = await req.json();
    if (!provedor_id) return json({ error: "provedor_id obrigatório" }, 400);

    const { data: provedor } = await supabase.from("ai_provedores").select("*").eq("id", provedor_id).single();
    if (!provedor) return json({ error: "Provedor não encontrado" }, 404);

    const apiKey = Deno.env.get(provedor.secret_name);
    if (!apiKey) {
      await supabase.from("ai_provedores").update({
        ultimo_teste_em: new Date().toISOString(),
        ultimo_teste_ok: false,
        ultimo_teste_erro: `Secret ${provedor.secret_name} não configurado`,
        status: "erro",
      }).eq("id", provedor_id);
      return json({ ok: false, error: `Secret ${provedor.secret_name} não configurado. Adicione via Settings → Edge Functions.` });
    }

    let testUrl = "";
    let headers: Record<string, string> = {};

    switch (provedor.tipo) {
      case "anthropic":
        testUrl = `${provedor.base_url}/models`;
        headers = { "x-api-key": apiKey, "anthropic-version": "2023-06-01" };
        break;
      case "google":
        testUrl = `${provedor.base_url}/models?key=${apiKey}`;
        break;
      default:
        testUrl = `${provedor.base_url}/models`;
        headers = { Authorization: `Bearer ${apiKey}` };
    }

    const r = await fetch(testUrl, { headers });
    const ok = r.ok;
    const text = ok ? "" : await r.text();

    await supabase.from("ai_provedores").update({
      ultimo_teste_em: new Date().toISOString(),
      ultimo_teste_ok: ok,
      ultimo_teste_erro: ok ? null : `${r.status}: ${text.slice(0, 500)}`,
      status: ok ? "ativo" : "erro",
    }).eq("id", provedor_id);

    return json({ ok, status: r.status, error: ok ? null : text.slice(0, 500) });
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
