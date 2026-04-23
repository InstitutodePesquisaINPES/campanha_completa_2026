import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type CampanhaParametros = Database["public"]["Tables"]["campanha_parametros"]["Row"];
export type CampanhaParametrosUpdate = Database["public"]["Tables"]["campanha_parametros"]["Update"];

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
      // garante que existe
      await supabase.rpc("inicializar_parametros_campanha" as never, { _campanha_id: campanhaId } as never);
      const { data, error } = await supabase
        .from("campanha_parametros")
        .select("*")
        .eq("campanha_id", campanhaId!)
        .maybeSingle();
      if (error) throw error;
      return data as CampanhaParametros | null;
    },
  });
}

export function useUpdateCampanhaParametros() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campanha_id, ...updates }: CampanhaParametrosUpdate & { campanha_id: string }) => {
      const { data, error } = await supabase
        .from("campanha_parametros")
        .update(updates)
        .eq("campanha_id", campanha_id)
        .select()
        .single();
      if (error) throw error;
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
      const { error } = await supabase.rpc("gerar_plano_90_dias" as never, { _campanha_id: campanhaId } as never);
      if (error) throw error;
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
