import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAIProvedores() {
  return useQuery({
    queryKey: ["ai_provedores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_provedores").select("*").order("prioridade");
      if (error) throw error;
      return data;
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
      return data;
    },
  });
}

export function useAICopilots() {
  return useQuery({
    queryKey: ["ai_copilots"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_copilots").select("*, ai_modelos(nome, modelo_id, ai_provedores(nome))").order("ordem");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertProvedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: any) => {
      const { error } = p.id
        ? await supabase.from("ai_provedores").update(p).eq("id", p.id)
        : await supabase.from("ai_provedores").insert(p);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Provedor salvo"); qc.invalidateQueries({ queryKey: ["ai_provedores"] }); },
    onError: (e: any) => toast.error(e.message),
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
    onError: (e: any) => toast.error(e.message),
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
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["ai_provedores"] });
      if (data.ok) toast.success("Conexão OK!");
      else toast.error(`Falhou: ${data.error}`);
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpsertModelo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: any) => {
      const { error } = m.id
        ? await supabase.from("ai_modelos").update(m).eq("id", m.id)
        : await supabase.from("ai_modelos").insert(m);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Modelo salvo"); qc.invalidateQueries({ queryKey: ["ai_modelos"] }); },
    onError: (e: any) => toast.error(e.message),
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
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpsertCopilot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: any) => {
      const { error } = c.id
        ? await supabase.from("ai_copilots").update(c).eq("id", c.id)
        : await supabase.from("ai_copilots").insert(c);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Copilot salvo"); qc.invalidateQueries({ queryKey: ["ai_copilots"] }); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useAIChat() {
  return useMutation({
    mutationFn: async (payload: { copilot_id?: string; modelo_id?: string; conversa_id?: string; messages: { role: string; content: string }[] }) => {
      const { data, error } = await supabase.functions.invoke("ai-chat-proxy", { body: payload });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
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
      return data;
    },
  });
}
