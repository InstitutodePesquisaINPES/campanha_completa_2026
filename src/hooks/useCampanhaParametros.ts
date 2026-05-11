import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";


export type CampanhaParametros = any;
export type CampanhaParametrosUpdate = any;

export type TarefaTemplate = {
  dia: number;
  semana: number;
  area: string;
  titulo: string;
  prioridade: string;
  fase?: string;
};

export const DEFAULTS_PARAMETROS = {
  escala_vereador: 1.0, escala_prefeito: 2.0, escala_vice_prefeito: 1.5,
  escala_deputado_estadual: 3.0, escala_deputado_federal: 4.0, escala_senador: 5.0,
  escala_governador: 6.0, escala_vice_governador: 4.0, escala_presidente: 10.0,
  pct_cadastro_sobre_votos: 0.30, pct_visitas_sobre_votos: 0.50,
  votos_por_fiscal: 250, custo_por_voto_reais: 4.0,
  min_cadastro: 50, min_visitas: 100, min_visitas_semana: 20,
  min_fiscais: 5, min_orcamento_reais: 10000,
  // Marcos legais conforme Lei 9.504/97 + Res. TSE 23.610/2019 (atualizada por 23.735/2024)
  // Aplicável às eleições gerais e municipais. Datas em dias antes da eleição (D-x).
  tse_registro_dias: 50,    // Art. 11 Lei 9.504 — registro até 15/ago (eleições gerais) / 15/ago (municipais)
  tse_registro_ativo: true,
  tse_propaganda_dias: 49,  // Art. 36 — propaganda eleitoral permitida a partir de 16/ago (D-49 nas gerais)
  tse_propaganda_ativo: true,
  tse_hgpe_dias: 35,        // Art. 47 — HGPE rádio e TV nos 35 dias antes do 1º turno
  tse_hgpe_ativo: true,
  tse_prestacao_dias: 21,   // Art. 28 §4º — prestação parcial divulgada até 9 dias antes; lançamento ~D-21
  tse_prestacao_ativo: true,
  tse_debates_dias: 48,     // Art. 46 — debates a partir de 16/ago (após registro)
  tse_debates_ativo: true,
  preservar_concluidas: true,
};

export function useCampanhaParametros(campanhaId?: string) {
  return useQuery({
    queryKey: ["campanha-parametros", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      // In a real implementation this would fetch from a specific endpoint
      // For now, we fallback to defaults if the endpoint doesn't exist
      try {
        const data = await api.get<CampanhaParametros>(`/campanhas/${campanhaId}/parametros`);
        return data || (DEFAULTS_PARAMETROS as unknown as CampanhaParametros);
      } catch (e) {
        return DEFAULTS_PARAMETROS as unknown as CampanhaParametros;
      }
    },
  });
}

export function useUpdateCampanhaParametros() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campanha_id, ...updates }: CampanhaParametrosUpdate & { campanha_id: string }) => {
      const data = await api.put<CampanhaParametros>(`/campanhas/${campanha_id}/parametros`, updates);
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["campanha-parametros", vars.campanha_id] });
      toast.success("Parâmetros salvos");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRegerarPlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campanhaId: string) => {
      await api.post(`/campanhas/${campanhaId}/gerar-plano`, {});
    },
    onSuccess: (_d, campanhaId) => {
      qc.invalidateQueries({ queryKey: ["tarefas", campanhaId] });
      qc.invalidateQueries({ queryKey: ["fases", campanhaId] });
      qc.invalidateQueries({ queryKey: ["metas", campanhaId] });
      qc.invalidateQueries({ queryKey: ["semanas", campanhaId] });
      toast.success("Plano regenerado com os novos parâmetros");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
