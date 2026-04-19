import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function useIndicadoresCampanha() {
  return useQuery({
    queryKey: ["indicadores-campanha"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_indicadores_campanha")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
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
  });
}

/**
 * Realtime subscriptions para o Sala de Situação.
 * Invalida indicadores e tarefas quando há mudanças nas tabelas relevantes.
 * Retorna status "live" para indicador visual.
 */
export function useComandoRealtime(campanhaId?: string) {
  const qc = useQueryClient();
  const [live, setLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const tables = ["demandas", "agenda", "campanha_tarefas", "despesas", "pessoas"];
    const ch = supabase.channel("comando-realtime");
    tables.forEach((t) => {
      ch.on("postgres_changes", { event: "*", schema: "public", table: t }, () => {
        qc.invalidateQueries({ queryKey: ["indicadores-campanha"] });
        if (campanhaId) qc.invalidateQueries({ queryKey: ["burndown", campanhaId] });
        setLastUpdate(new Date());
      });
    });
    ch.subscribe((status) => {
      setLive(status === "SUBSCRIBED");
    });
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc, campanhaId]);

  return { live, lastUpdate };
}

export function useBurndown(campanhaId?: string) {
  return useQuery({
    queryKey: ["burndown", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_burndown_tarefas")
        .select("*")
        .eq("campanha_id", campanhaId)
        .order("data_prevista");
      if (error) throw error;
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
      const { data, error } = await (supabase as any)
        .from("reunioes")
        .select("*")
        .order("data_reuniao", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useDeliberacoes(reuniaoId?: string) {
  return useQuery({
    queryKey: ["deliberacoes", reuniaoId],
    enabled: !!reuniaoId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reuniao_deliberacoes")
        .select("*")
        .eq("reuniao_id", reuniaoId)
        .order("created_at");
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateReuniao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { titulo: string; data_reuniao: string; pauta?: string; local?: string; tipo?: string; campanha_id?: string }) => {
      const { data, error } = await (supabase as any).from("reunioes").insert(input).select().single();
      if (error) throw error;
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
      const { data, error } = await (supabase as any).from("reunioes").update(updates).eq("id", id).select().single();
      if (error) throw error;
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
      const { data, error } = await (supabase as any).from("reuniao_deliberacoes").insert(input).select().single();
      if (error) throw error;
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
      const { error } = await (supabase as any).from("reuniao_deliberacoes").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliberacoes"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
