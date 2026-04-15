import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/cors";

const TEST_USERS = [
  { email: "admin@sigt.test", role: "admin", name: "Admin SIGT" },
  { email: "coordenador@sigt.test", role: "coordenador", name: "Maria Coordenadora" },
  { email: "lideranca@sigt.test", role: "lideranca", name: "João Liderança" },
  { email: "operador@sigt.test", role: "operador", name: "Ana Operadora" },
  { email: "visualizador@sigt.test", role: "visualizador", name: "Carlos Visualizador" },
];

const PASSWORD = "Sigt@2024";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: { email: string; status: string; role: string }[] = [];

    for (const user of TEST_USERS) {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u: any) => u.email === user.email);

      if (existing) {
        // Ensure role exists
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", existing.id)
          .eq("role", user.role)
          .maybeSingle();

        if (!existingRole) {
          await supabase.from("user_roles").insert({ user_id: existing.id, role: user.role });
        }

        results.push({ email: user.email, status: "already_exists", role: user.role });
        continue;
      }

      // Create user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: user.name },
      });

      if (createError) {
        results.push({ email: user.email, status: `error: ${createError.message}`, role: user.role });
        continue;
      }

      // Assign role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role: user.role });

      if (roleError) {
        results.push({ email: user.email, status: `created but role error: ${roleError.message}`, role: user.role });
        continue;
      }

      results.push({ email: user.email, status: "created", role: user.role });
    }

    return new Response(JSON.stringify({ success: true, results, password: PASSWORD }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
