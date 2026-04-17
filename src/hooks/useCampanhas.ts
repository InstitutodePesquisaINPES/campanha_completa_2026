import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type Campanha = Database["public"]["Tables"]["campanhas"]["Row"];
export type CampanhaInsert = Database["public"]["Tables"]["campanhas"]["Insert"];
export type Tarefa = Database["public"]["Tables"]["campanha_tarefas"]["Row"];
export type Fase = Database["public"]["Tables"]["campanha_fases"]["Row"];
export type Meta = Database["public"]["Tables"]["campanha_metas"]["Row"];
export type Semana = Database["public"]["Tables"]["campanha_semanas"]["Row"];

export function useCampanhas() {
  return useQuery({
    queryKey: ["campanhas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanhas")
        .select("*, municipios(nome), estados(sigla, nome), pessoas(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCampanha(id?: string) {
  return useQuery({
    queryKey: ["campanha", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanhas")
        .select("*, municipios(nome), estados(sigla, nome), pessoas(full_name)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCampanhaAtiva() {
  return useQuery({
    queryKey: ["campanha-ativa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanhas")
        .select("*")
        .eq("ativa", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useFases(campanhaId?: string) {
  return useQuery({
    queryKey: ["fases", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanha_fases")
        .select("*")
        .eq("campanha_id", campanhaId!)
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });
}

export function useTarefas(campanhaId?: string) {
  return useQuery({
    queryKey: ["tarefas", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanha_tarefas")
        .select("*")
        .eq("campanha_id", campanhaId!)
        .order("dia")
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });
}

export function useMetas(campanhaId?: string) {
  return useQuery({
    queryKey: ["metas", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanha_metas")
        .select("*")
        .eq("campanha_id", campanhaId!)
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });
}

export function useSemanas(campanhaId?: string) {
  return useQuery({
    queryKey: ["semanas", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanha_semanas")
        .select("*")
        .eq("campanha_id", campanhaId!)
        .order("numero_semana");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCampanha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CampanhaInsert) => {
      const { data, error } = await supabase
        .from("campanhas")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      const { error: rpcError } = await supabase.rpc("gerar_plano_90_dias" as never, {
        _campanha_id: data.id,
      } as never);
      if (rpcError) throw rpcError;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campanhas"] });
      qc.invalidateQueries({ queryKey: ["campanha-ativa"] });
      toast.success("Campanha criada com plano 90 dias gerado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tarefa> & { id: string }) => {
      const { data, error } = await supabase
        .from("campanha_tarefas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Meta> & { id: string }) => {
      const { data, error } = await supabase
        .from("campanha_metas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metas"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
