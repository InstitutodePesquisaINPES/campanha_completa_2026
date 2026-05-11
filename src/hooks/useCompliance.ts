import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";

// ---------- Contratos ----------
export type Contrato = {
  id: string;
  campanha_id: string | null;
  fornecedor_pessoa_id: string | null;
  centro_custo_id: string | null;
  numero: string | null;
  objeto: string;
  valor: number;
  data_inicio: string;
  data_fim: string;
  status: "rascunho" | "vigente" | "encerrado" | "cancelado" | "vencido";
  arquivo_url: string | null;
  observacoes: string | null;
  responsavel_id: string | null;
  created_at: string;
  updated_at: string;
};

export function useContratos() {
  return useQuery({
    queryKey: ["contratos"],
    queryFn: async () => {
      const data = await api.get<Contrato[]>("/contratos");
      return data || [];
    },
  });
}

export function useContratosAlerta() {
  return useQuery({
    queryKey: ["contratos-alerta"],
    queryFn: async () => {
      const data = await api.get<(Contrato & { dias_para_vencer: number })[]>("/contratos/alertas");
      return data || [];
    },
  });
}

export function useUpsertContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Contrato> & { objeto: string; data_inicio: string; data_fim: string }) => {
      const { id, ...rest } = input as any;
      if (id) {
        return await api.put<Contrato>(`/contratos/${id}`, rest);
      }
      return await api.post<Contrato>("/contratos", rest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos"] });
      qc.invalidateQueries({ queryKey: ["contratos-alerta"] });
      toast.success("Contrato salvo");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contratos/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Contrato removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---------- Riscos ----------
export type Risco = {
  id: string;
  campanha_id: string | null;
  titulo: string;
  descricao: string | null;
  categoria: "juridico" | "reputacional" | "financeiro" | "operacional" | "eleitoral";
  severidade: "baixa" | "media" | "alta" | "critica";
  probabilidade: number;
  impacto: number;
  status: "identificado" | "em_mitigacao" | "mitigado" | "aceito" | "materializado";
  plano_mitigacao: string | null;
  responsavel_id: string | null;
  data_revisao: string | null;
  created_at: string;
  updated_at: string;
};

export function useRiscos() {
  return useQuery({
    queryKey: ["riscos"],
    queryFn: async () => {
      const data = await api.get<Risco[]>("/compliance/riscos");
      return data || [];
    },
  });
}

export function useUpsertRisco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Risco> & { titulo: string; categoria: Risco["categoria"] }) => {
      const { id, ...rest } = input as any;
      if (id) {
        return await api.put<Risco>(`/compliance/riscos/${id}`, rest);
      }
      return await api.post<Risco>("/compliance/riscos", rest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["riscos"] });
      toast.success("Risco salvo");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRisco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/compliance/riscos/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["riscos"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---------- Incidentes ----------
export type Incidente = {
  id: string;
  campanha_id: string | null;
  risco_id: string | null;
  titulo: string;
  descricao: string | null;
  categoria: Risco["categoria"];
  severidade: Risco["severidade"];
  status: "aberto" | "em_apuracao" | "resolvido" | "arquivado";
  data_ocorrencia: string;
  data_resolucao: string | null;
  acoes_tomadas: string | null;
  responsavel_id: string | null;
  created_at: string;
  updated_at: string;
};

export function useIncidentes() {
  return useQuery({
    queryKey: ["incidentes"],
    queryFn: async () => {
      const data = await api.get<Incidente[]>("/compliance/incidentes");
      return data || [];
    },
  });
}

export function useUpsertIncidente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Incidente> & { titulo: string; categoria: Risco["categoria"] }) => {
      const { id, ...rest } = input as any;
      if (id) {
        return await api.put<Incidente>(`/compliance/incidentes/${id}`, rest);
      }
      return await api.post<Incidente>("/compliance/incidentes", rest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidentes"] });
      toast.success("Incidente salvo");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteIncidente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/compliance/incidentes/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidentes"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
