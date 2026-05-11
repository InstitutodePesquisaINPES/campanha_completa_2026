import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";

export type TarefaAnexo = {
  id: string;
  tarefa_id: string;
  campanha_id: string;
  titulo: string;
  descricao: string | null;
  tipo_documento: string | null;
  storage_path: string;
  arquivo_nome: string | null;
  arquivo_tamanho: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export function useTarefaAnexos(tarefaId?: string) {
  return useQuery({
    queryKey: ["tarefa-anexos", tarefaId],
    enabled: !!tarefaId,
    queryFn: async () => {
      const data = await api.get<TarefaAnexo[]>(`/campanhas/tarefas/${tarefaId}/anexos`);
      return data || [];
    },
  });
}

export function useUploadTarefaAnexo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tarefa_id: string;
      campanha_id: string;
      titulo: string;
      descricao?: string;
      tipo_documento?: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("file", input.file);
      formData.append("titulo", input.titulo);
      if (input.descricao) formData.append("descricao", input.descricao);
      if (input.tipo_documento) formData.append("tipo_documento", input.tipo_documento);

      const data = await api.upload<TarefaAnexo>(`/campanhas/tarefas/${input.tarefa_id}/anexos`, formData);
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["tarefa-anexos", vars.tarefa_id] });
      qc.invalidateQueries({ queryKey: ["documentos"] });
      toast.success("Anexo enviado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTarefaAnexo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (anexo: TarefaAnexo) => {
      await api.delete(`/campanhas/tarefas/anexos/${anexo.id}`);
    },
    onSuccess: (_d, anexo) => {
      qc.invalidateQueries({ queryKey: ["tarefa-anexos", anexo.tarefa_id] });
      qc.invalidateQueries({ queryKey: ["documentos"] });
      toast.success("Anexo removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function getSignedUrl(path: string) {
  return `/uploads/${path}`;
}
