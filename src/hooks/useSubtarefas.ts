import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Subtarefa = {
  id: string;
  tarefa_id: string;
  campanha_id: string;
  titulo: string;
  concluida: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
};

export function useSubtarefas(tarefaId?: string) {
  return useQuery({
    queryKey: ["subtarefas", tarefaId],
    enabled: !!tarefaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanha_subtarefas" as never)
        .select("*")
        .eq("tarefa_id", tarefaId!)
        .order("ordem")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Subtarefa[];
    },
  });
}

export function useCreateSubtarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tarefa_id: string; campanha_id: string; titulo: string; ordem?: number }) => {
      const { data, error } = await supabase
        .from("campanha_subtarefas" as never)
        .insert(input as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["subtarefas", vars.tarefa_id] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSubtarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Subtarefa> & { id: string }) => {
      const { data, error } = await supabase
        .from("campanha_subtarefas" as never)
        .update(patch as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Subtarefa;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["subtarefas", d.tarefa_id] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSubtarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tarefa_id }: { id: string; tarefa_id: string }) => {
      const { error } = await supabase.from("campanha_subtarefas" as never).delete().eq("id", id);
      if (error) throw error;
      return tarefa_id;
    },
    onSuccess: (tid) => qc.invalidateQueries({ queryKey: ["subtarefas", tid] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
