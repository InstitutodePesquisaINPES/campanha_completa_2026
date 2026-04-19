// AI Chat Proxy — encaminha chamadas para qualquer provedor cadastrado
// Suporta: openai-compatible, anthropic, google
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  copilot_id?: string;
  modelo_id?: string;
  conversa_id?: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body: ChatRequest = await req.json();
    if (!body.messages?.length) return json({ error: "messages required" }, 400);

    // Resolve modelo (via copilot ou direto)
    let modeloId = body.modelo_id;
    let temperature = body.temperature ?? 0.7;
    let maxTokens = body.max_tokens ?? 2048;
    let systemPrompt: string | null = null;

    if (body.copilot_id) {
      const { data: copilot } = await supabase
        .from("ai_copilots").select("*, ai_modelos(*)")
        .eq("id", body.copilot_id).maybeSingle();
      if (!copilot) return json({ error: "Copilot não encontrado" }, 404);
      modeloId = copilot.modelo_id ?? modeloId;
      temperature = copilot.temperatura;
      maxTokens = copilot.max_tokens;
      systemPrompt = copilot.prompt_sistema;
    }

    if (!modeloId) return json({ error: "Selecione um modelo ou copilot" }, 400);

    const { data: modelo } = await supabase
      .from("ai_modelos").select("*, ai_provedores(*)")
      .eq("id", modeloId).maybeSingle();
    if (!modelo) return json({ error: "Modelo não encontrado" }, 404);

    const provedor = (modelo as any).ai_provedores;
    if (!provedor || provedor.status !== "ativo") {
      return json({ error: `Provedor ${provedor?.nome ?? ""} inativo` }, 400);
    }

    const apiKey = Deno.env.get(provedor.secret_name);
    if (!apiKey) {
      return json({ error: `Secret ${provedor.secret_name} não configurado` }, 500);
    }

    // Monta mensagens com system prompt
    const finalMessages = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...body.messages]
      : body.messages;

    const start = Date.now();
    let result: { content: string; tokensIn: number; tokensOut: number };

    if (provedor.tipo === "anthropic") {
      result = await callAnthropic(provedor.base_url, apiKey, modelo.modelo_id, finalMessages, temperature, maxTokens);
    } else if (provedor.tipo === "google") {
      result = await callGoogle(provedor.base_url, apiKey, modelo.modelo_id, finalMessages, temperature, maxTokens);
    } else {
      // openai-compatible: openai, groq, mistral, openrouter, deepseek, xai, perplexity
      result = await callOpenAICompatible(provedor.base_url, apiKey, modelo.modelo_id, finalMessages, temperature, maxTokens, provedor.headers_extra);
    }

    const latency = Date.now() - start;
    const custo = (result.tokensIn / 1_000_000) * Number(modelo.custo_input_por_1m) +
                  (result.tokensOut / 1_000_000) * Number(modelo.custo_output_por_1m);

    // Log de uso
    await supabase.from("ai_uso_log").insert({
      user_id: user.id,
      provedor_id: provedor.id,
      modelo_id: modelo.id,
      copilot_id: body.copilot_id ?? null,
      conversa_id: body.conversa_id ?? null,
      tokens_input: result.tokensIn,
      tokens_output: result.tokensOut,
      custo_estimado: custo,
      latencia_ms: latency,
      sucesso: true,
    });

    // Persiste mensagens se houver conversa
    if (body.conversa_id) {
      const lastUser = body.messages[body.messages.length - 1];
      await supabase.from("ai_mensagens").insert([
        { conversa_id: body.conversa_id, role: "user", content: lastUser.content },
        { conversa_id: body.conversa_id, role: "assistant", content: result.content, tokens_input: result.tokensIn, tokens_output: result.tokensOut, modelo_usado: modelo.modelo_id },
      ]);
      await supabase.from("ai_conversas").update({
        ultima_mensagem_em: new Date().toISOString(),
        total_mensagens: (await supabase.from("ai_mensagens").select("*", { count: "exact", head: true }).eq("conversa_id", body.conversa_id)).count ?? 0,
        total_tokens: result.tokensIn + result.tokensOut,
        custo_estimado: custo,
      }).eq("id", body.conversa_id);
    }

    return json({
      content: result.content,
      tokens: { input: result.tokensIn, output: result.tokensOut },
      custo_estimado: custo,
      latencia_ms: latency,
      modelo: modelo.modelo_id,
      provedor: provedor.nome,
    });
  } catch (e) {
    console.error("ai-chat-proxy error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callOpenAICompatible(baseUrl: string, key: string, model: string, messages: any[], temperature: number, maxTokens: number, headersExtra: Record<string, string>) {
  const r = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...headersExtra },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  });
  if (!r.ok) throw new Error(`Provider error ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    tokensIn: data.usage?.prompt_tokens ?? 0,
    tokensOut: data.usage?.completion_tokens ?? 0,
  };
}

async function callAnthropic(baseUrl: string, key: string, model: string, messages: any[], temperature: number, maxTokens: number) {
  const system = messages.find(m => m.role === "system")?.content;
  const filtered = messages.filter(m => m.role !== "system");
  const r = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model, max_tokens: maxTokens, temperature, system, messages: filtered }),
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return {
    content: data.content?.[0]?.text ?? "",
    tokensIn: data.usage?.input_tokens ?? 0,
    tokensOut: data.usage?.output_tokens ?? 0,
  };
}

async function callGoogle(baseUrl: string, key: string, model: string, messages: any[], temperature: number, maxTokens: number) {
  const system = messages.find(m => m.role === "system")?.content;
  const contents = messages.filter(m => m.role !== "system").map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const r = await fetch(`${baseUrl}/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });
  if (!r.ok) throw new Error(`Google ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
    tokensIn: data.usageMetadata?.promptTokenCount ?? 0,
    tokensOut: data.usageMetadata?.candidatesTokenCount ?? 0,
  };
}
