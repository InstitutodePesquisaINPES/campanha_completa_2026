import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
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
      const data = await api.get<Subtarefa[]>(`/campanhas/tarefas/${tarefaId}/subtarefas`);
      return data || [];
    },
  });
}

export function useCreateSubtarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tarefa_id: string; campanha_id: string; titulo: string; ordem?: number }) => {
      const data = await api.post(`/campanhas/tarefas/${input.tarefa_id}/subtarefas`, input);
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
      // Assuming patch has tarefa_id to invalidate query properly if not handled differently. 
      const data = await api.put<any>(`/campanhas/subtarefas/${id}`, patch);
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["subtarefas", d?.tarefa_id] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSubtarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tarefa_id }: { id: string; tarefa_id: string }) => {
      await api.delete(`/campanhas/subtarefas/${id}`);
      return tarefa_id;
    },
    onSuccess: (tid) => qc.invalidateQueries({ queryKey: ["subtarefas", tid] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
