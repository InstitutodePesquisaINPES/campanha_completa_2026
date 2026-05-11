import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

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
      const data = await api.get<TseImportJob[]>("/tse/jobs");
      return data || [];
    },
    refetchInterval: 3000,
  });
}

export function useTSEJobLogs(jobId?: string) {
  return useQuery({
    queryKey: ["tse-job-logs", jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const data = await api.get<any[]>(`/tse/jobs/${jobId}/logs`);
      return data || [];
    },
    enabled: !!jobId,
    refetchInterval: 3000,
  });
}

export function useTSEStats() {
  return useQuery({
    queryKey: ["tse-stats"],
    queryFn: async () => {
      const data = await api.get<any>("/tse/stats");
      return {
        eleitorado: Number(data?.eleitorado ?? 0),
        candidatos: Number(data?.candidatos ?? 0),
        resultados: Number(data?.resultados ?? 0),
        locais: Number(data?.locais ?? 0),
        prestacao_contas: Number(data?.prestacao_contas ?? 0),
      };
    },
    refetchInterval: 5000,
  });
}

export function useEnqueueTSE() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { uf: string; anos: number[]; tipos: TseJobTipo[] }) => {
      const data = await api.post("/tse/jobs/enqueue", vars);
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
      const data = await api.post("/tse/jobs/run", {});
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-jobs"] }),
  });
}

export function useCancelTSEJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tse/jobs/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-jobs"] }),
  });
}
