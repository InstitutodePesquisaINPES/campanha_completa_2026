import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export function useIndicadoresCampanha() {
  return useQuery({
    queryKey: ["indicadores-campanha"],
    queryFn: async () => {
      const data = await api.get<any>('/comando/indicadores');
      return data as {
        campanha_id: string;
        campanha_nome: string;
        cargo: string;
        meta_votos: number | null;
        data_eleicao: string;
        dias_restantes: number;
        total_pessoas: number;
        demandas_abertas: number;
        demandas_resolvidas: number;
        demandas_urgentes: number;
        eventos_futuros: number;
        tarefas_concluidas: number;
        tarefas_total: number;
        tarefas_atrasadas: number;
        total_gasto: number;
        orcamento_total: number;
      } | null;
    },
    // Poll every 30 seconds since we removed Supabase Realtime
    refetchInterval: 30000, 
  });
}

/**
 * Polling para o Sala de Situação.
 * Invalida indicadores e tarefas periodicamente.
 */
export function useComandoRealtime(campanhaId?: string) {
  const qc = useQueryClient();
  const [live, setLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [qc, campanhaId]);

  return { live, lastUpdate };
}

export function useBurndown(campanhaId?: string) {
  return useQuery({
    queryKey: ["burndown", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const data = await api.get<any[]>(`/comando/burndown?campanhaId=${campanhaId}`);
      return (data || []) as Array<{
        data_prevista: string;
        total_acumulado: number;
        concluidas_acumulado: number;
      }>;
    },
  });
}

export function useReunioes() {
  return useQuery({
    queryKey: ["reunioes"],
    queryFn: async () => {
      const data = await api.get<any[]>('/comando/reunioes');
      return (data || []).map(r => ({
        ...r,
        data_reuniao: r.dataReuniao,
        campanha_id: r.campanhaId,
        created_at: r.createdAt,
      }));
    },
  });
}

export function useDeliberacoes(reuniaoId?: string) {
  return useQuery({
    queryKey: ["deliberacoes", reuniaoId],
    enabled: !!reuniaoId,
    queryFn: async () => {
      const data = await api.get<any[]>(`/comando/deliberacoes?reuniaoId=${reuniaoId}`);
      return (data || []).map(d => ({
        ...d,
        reuniao_id: d.reuniaoId,
        responsavel_id: d.responsavelId,
        created_at: d.createdAt,
      }));
    },
  });
}

export function useCreateReuniao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { titulo: string; data_reuniao: string; pauta?: string; local?: string; tipo?: string; campanha_id?: string }) => {
      const payload = {
        titulo: input.titulo,
        dataReuniao: input.data_reuniao,
        pauta: input.pauta,
        local: input.local,
        tipo: input.tipo,
        campanhaId: input.campanha_id,
      };
      const data = await api.post('/comando/reunioes', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reunioes"] });
      toast.success("Reunião criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateReuniao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [k: string]: any }) => {
      // Basic camelCase translation
      const payload: any = {};
      if (updates.data_reuniao) payload.dataReuniao = updates.data_reuniao;
      if (updates.titulo) payload.titulo = updates.titulo;
      if (updates.pauta) payload.pauta = updates.pauta;
      if (updates.local) payload.local = updates.local;
      if (updates.tipo) payload.tipo = updates.tipo;

      const data = await api.put(`/comando/reunioes/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reunioes"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateDeliberacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { reuniao_id: string; descricao: string; prazo?: string; responsavel_id?: string }) => {
      const payload = {
        reuniaoId: input.reuniao_id,
        descricao: input.descricao,
        prazo: input.prazo,
        responsavelId: input.responsavel_id,
      };
      const data = await api.post('/comando/deliberacoes', payload);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["deliberacoes", vars.reuniao_id] });
      toast.success("Deliberação adicionada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleDeliberacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/comando/deliberacoes/${id}/status`, { status });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliberacoes"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
