import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Tables = Database["public"]["Tables"];
type AIProviderRow = Tables["ai_provedores"]["Row"];
type AIProviderInsert = Tables["ai_provedores"]["Insert"];
type AIProviderUpdate = Tables["ai_provedores"]["Update"];
type AIModelRow = Tables["ai_modelos"]["Row"];
type AIModelInsert = Tables["ai_modelos"]["Insert"];
type AIModelUpdate = Tables["ai_modelos"]["Update"];
type AICopilotRow = Tables["ai_copilots"]["Row"];
type AICopilotInsert = Tables["ai_copilots"]["Insert"];
type AICopilotUpdate = Tables["ai_copilots"]["Update"];
type AIUsageLogRow = Tables["ai_uso_log"]["Row"];

type ProviderSummary = Pick<AIProviderRow, "nome" | "tipo" | "status">;
type ProviderName = Pick<AIProviderRow, "nome">;

export type AIProviderPayload = AIProviderInsert | (AIProviderUpdate & { id: string });
export type AIModelPayload = AIModelInsert | (AIModelUpdate & { id: string });
export type AICopilotPayload = AICopilotInsert | (AICopilotUpdate & { id: string });
export type AIProviderMutationPayload = AIProviderInsert & { id?: string };
export type AIModelMutationPayload = AIModelInsert & { id?: string };
export type AICopilotMutationPayload = AICopilotInsert & { id?: string };

export type AIModelWithProvider = AIModelRow & {
  ai_provedores: ProviderSummary | null;
};

export type AICopilotWithModel = AICopilotRow & {
  ai_modelos: (Pick<AIModelRow, "nome" | "modelo_id"> & {
    ai_provedores: ProviderName | null;
  }) | null;
};

export type AIUsageLogWithRelations = AIUsageLogRow & {
  ai_provedores: ProviderName | null;
  ai_modelos: Pick<AIModelRow, "nome"> | null;
  ai_copilots: Pick<AICopilotRow, "nome"> | null;
};

export interface AIChatPayload {
  copilot_id?: string;
  modelo_id?: string;
  conversa_id?: string;
  messages: Array<{ role: string; content: string }>;
}

export interface AIChatResponse {
  content: string;
  tokens?: { input: number; output: number };
  custo_estimado?: number;
  latencia_ms?: number;
  modelo?: string;
  provedor?: string;
  error?: string;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Erro inesperado";
}

export function useAIProvedores() {
  return useQuery({
    queryKey: ["ai_provedores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_provedores").select("*").order("prioridade");
      if (error) throw error;
      return (data ?? []) as AIProviderRow[];
    },
  });
}

export function useAIModelos(provedorId?: string) {
  return useQuery({
    queryKey: ["ai_modelos", provedorId],
    queryFn: async () => {
      let q = supabase.from("ai_modelos").select("*, ai_provedores(nome, tipo, status)").order("nome");
      if (provedorId) q = q.eq("provedor_id", provedorId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AIModelWithProvider[];
    },
  });
}

export function useAICopilots() {
  return useQuery({
    queryKey: ["ai_copilots"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_copilots").select("*, ai_modelos(nome, modelo_id, ai_provedores(nome))").order("ordem");
      if (error) throw error;
      return (data ?? []) as AICopilotWithModel[];
    },
  });
}

export function useUpsertProvedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: AIProviderMutationPayload) => {
      const { error } = "id" in p && p.id
        ? await supabase.from("ai_provedores").update(p as AIProviderUpdate).eq("id", p.id)
        : await supabase.from("ai_provedores").insert(p as AIProviderInsert);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Provedor salvo"); qc.invalidateQueries({ queryKey: ["ai_provedores"] }); },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteProvedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_provedores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Provedor removido"); qc.invalidateQueries({ queryKey: ["ai_provedores"] }); },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  });
}

export function useTestProvedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (provedor_id: string) => {
      const { data, error } = await supabase.functions.invoke("ai-test-provider", { body: { provedor_id } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { ok?: boolean; error?: string } | null) => {
      qc.invalidateQueries({ queryKey: ["ai_provedores"] });
      if (data?.ok) toast.success("Conexão OK!");
      else toast.error(`Falhou: ${data?.error ?? "Erro desconhecido"}`);
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  });
}

export function useUpsertModelo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: AIModelMutationPayload) => {
      const { error } = "id" in m && m.id
        ? await supabase.from("ai_modelos").update(m as AIModelUpdate).eq("id", m.id)
        : await supabase.from("ai_modelos").insert(m as AIModelInsert);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Modelo salvo"); qc.invalidateQueries({ queryKey: ["ai_modelos"] }); },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteModelo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_modelos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Modelo removido"); qc.invalidateQueries({ queryKey: ["ai_modelos"] }); },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  });
}

export function useUpsertCopilot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: AICopilotMutationPayload) => {
      const { error } = "id" in c && c.id
        ? await supabase.from("ai_copilots").update(c as AICopilotUpdate).eq("id", c.id)
        : await supabase.from("ai_copilots").insert(c as AICopilotInsert);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Copilot salvo"); qc.invalidateQueries({ queryKey: ["ai_copilots"] }); },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  });
}

export function useAIChat() {
  return useMutation({
    mutationFn: async (payload: AIChatPayload) => {
      const { data, error } = await supabase.functions.invoke("ai-chat-proxy", { body: payload });
      if (error) throw error;
      const response = data as AIChatResponse | null;
      if (response?.error) throw new Error(response.error);
      if (!response) throw new Error("Resposta vazia do provedor");
      return response;
    },
  });
}

export function useAIUsoLog(limit = 50) {
  return useQuery({
    queryKey: ["ai_uso_log", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_uso_log")
        .select("*, ai_provedores(nome), ai_modelos(nome), ai_copilots(nome)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AIUsageLogWithRelations[];
    },
  });
}
