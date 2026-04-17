import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TseJobStatus = "queued" | "running" | "done" | "failed" | "cancelled";
export type TseJobTipo = "eleitorado" | "locais" | "candidatos" | "resultados" | "prestacao_contas";

export interface TseImportJob {
  id: string;
  tipo: TseJobTipo;
  uf: string;
  ano: number;
  status: TseJobStatus;
  total_registros: number | null;
  registros_processados: number | null;
  progress_pct: number;
  error_msg: string | null;
  source_url: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export function useTSEJobs() {
  return useQuery({
    queryKey: ["tse-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tse_import_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as TseImportJob[];
    },
    refetchInterval: 3000,
  });
}

export function useTSEJobLogs(jobId?: string) {
  return useQuery({
    queryKey: ["tse-job-logs", jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from("tse_import_logs")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
    refetchInterval: 3000,
  });
}

export function useTSEStats() {
  return useQuery({
    queryKey: ["tse-stats"],
    queryFn: async () => {
      const [el, ca, re, lo, pc] = await Promise.all([
        supabase.from("tse_eleitorado").select("*", { count: "exact", head: true }),
        supabase.from("tse_candidatos").select("*", { count: "exact", head: true }),
        supabase.from("tse_resultados_secao").select("*", { count: "exact", head: true }),
        supabase.from("tse_locais_votacao").select("*", { count: "exact", head: true }),
        supabase.from("tse_prestacao_contas").select("*", { count: "exact", head: true }),
      ]);
      return {
        eleitorado: el.count ?? 0,
        candidatos: ca.count ?? 0,
        resultados: re.count ?? 0,
        locais: lo.count ?? 0,
        prestacao_contas: pc.count ?? 0,
      };
    },
    refetchInterval: 5000,
  });
}

export function useEnqueueTSE() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { uf: string; anos: number[]; tipos: TseJobTipo[] }) => {
      const { data, error } = await supabase.functions.invoke("tse-import-enqueue", { body: vars });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tse-jobs"] });
    },
  });
}

export function useRunWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("tse-import-worker", { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-jobs"] }),
  });
}

export function useCancelTSEJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tse_import_jobs")
        .update({ status: "cancelled", finished_at: new Date().toISOString() })
        .eq("id", id)
        .in("status", ["queued", "running"]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-jobs"] }),
  });
}
