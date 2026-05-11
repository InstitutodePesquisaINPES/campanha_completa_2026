import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";

export type CoberturaMunicipio = {
  campanha_id: string;
  municipio_id: string;
  municipio_nome: string;
  geocodigo_ibge: string | null;
  meta_votos: number;
  meta_cadastros: number;
  prioridade: "alta" | "media" | "baixa";
  cadastrados: number;
  eleitorado_tse: number;
  bairros_count: number;
};

export function useCoberturaTerritorial(campanhaId?: string) {
  return useQuery({
    queryKey: ["cobertura-territorial", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const data = await api.get<CoberturaMunicipio[]>(`/territorio/cobertura?campanhaId=${campanhaId}`);
      return data || [];
    },
  });
}

export function useUpsertMetaMunicipio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      campanha_id: string;
      municipio_id: string;
      meta_votos?: number;
      meta_cadastros?: number;
      prioridade?: "alta" | "media" | "baixa";
      observacoes?: string;
    }) => {
      const data = await api.post(`/territorio/metas`, input);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["cobertura-territorial", vars.campanha_id] });
      toast.success("Meta atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/**
 * Distribui a meta global proporcionalmente ao eleitorado TSE de cada município de foco.
 * Cria registros zerados onde ainda não há meta, mantendo metas já definidas.
 */
export function useDistribuirMetaProporcional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { campanha_id: string; meta_global: number; municipios: CoberturaMunicipio[] }) => {
      const data = await api.post<any>(`/territorio/metas/distribuir`, input);
      return data?.count || 0;
    },
    onSuccess: (count, vars) => {
      qc.invalidateQueries({ queryKey: ["cobertura-territorial", vars.campanha_id] });
      toast.success(`Meta distribuída em ${count} municípios proporcional ao eleitorado TSE`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
