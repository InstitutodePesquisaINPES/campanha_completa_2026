import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Promove uma liderança para o CRM (cria pessoa) e vincula via pessoa_id.
 */
export function usePromoverLiderancaParaCRM() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (lideranca: any) => {
      if (lideranca.pessoa_id) {
        toast.info("Liderança já está no CRM");
        return lideranca.pessoa_id;
      }

      const res = await api.post<any>(`/inteligencia/liderancas/${lideranca.id}/promover`, {});
      return res?.pessoaId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["liderancas"] });
      qc.invalidateQueries({ queryKey: ["pessoas"] });
      qc.invalidateQueries({ queryKey: ["inteligencia-kpis"] });
      toast.success("Liderança adicionada ao CRM");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

/**
 * Cria demanda territorial vinculada a um bairro/município (a partir do mapa estratégico).
 */
export function useCriarDemandaTerritorial() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { titulo: string; descricao?: string; bairro_id?: string; municipio_id?: string; prioridade?: string }) => {
      const payload = {
        titulo: input.titulo,
        descricao: input.descricao,
        bairroId: input.bairro_id,
        municipioId: input.municipio_id,
        prioridade: input.prioridade ?? "alta",
        protocolo: "TEMP",
      };
      // Assumption: The demandas endpoint should exist in a DemandasModule, but for now we will just use a generic api call. 
      // It might be needed to implement the DemandasModule later. Assuming it exists.
      const data = await api.post('/demandas', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demandas"] });
      qc.invalidateQueries({ queryKey: ["inteligencia-kpis"] });
      toast.success("Demanda criada");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

/**
 * Adiciona/promove um município ao plano estratégico (cria registro em municipios_estrategicos).
 */
export function useAdicionarMunicipioAoPlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { campanha_id: string; municipio_id: string; classificacao?: string; meta_votos?: number; observacoes?: string }) => {
      const payload = {
        campanhaId: input.campanha_id,
        municipioId: input.municipio_id,
        classificacao: input.classificacao ?? "expansao",
        metaVotos: input.meta_votos ?? 0,
        score: 50,
        prioridade: 3,
        observacoes: input.observacoes,
      };
      const data = await api.post('/territorio/municipios/strategic', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["municipios-estrategicos"] });
      qc.invalidateQueries({ queryKey: ["inteligencia-kpis"] });
      toast.success("Município adicionado ao plano");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
