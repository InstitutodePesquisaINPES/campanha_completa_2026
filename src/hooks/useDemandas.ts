import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

export type CategoriaDemanda = "saude" | "educacao" | "infraestrutura" | "seguranca" | "social" | "emprego" | "moradia" | "transporte" | "outros";
export type PrioridadeDemanda = "baixa" | "media" | "alta" | "urgente";
export type StatusDemanda = "aberta" | "triagem" | "encaminhada" | "em_andamento" | "resolvida" | "arquivada";
export type OrigemDemanda = "visita" | "telefone" | "whatsapp" | "gabinete" | "evento" | "rede_social";

export const categoriaLabels: Record<string, string> = {
  saude: "Saúde", educacao: "Educação", infraestrutura: "Infraestrutura", seguranca: "Segurança",
  social: "Social", emprego: "Emprego", moradia: "Moradia", transporte: "Transporte", outros: "Outros",
};

export const prioridadeLabels: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };
export const prioridadeColors: Record<string, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-primary/15 text-primary",
  alta: "bg-warning/15 text-warning",
  urgente: "bg-destructive/15 text-destructive",
};
export const prioridadeSLA: Record<string, number> = { urgente: 2, alta: 7, media: 15, baixa: 30 };

export const statusLabels: Record<string, string> = {
  aberta: "Aberta", triagem: "Triagem", encaminhada: "Encaminhada",
  em_andamento: "Em Andamento", resolvida: "Resolvida", arquivada: "Arquivada",
};
export const statusColors: Record<string, string> = {
  aberta: "bg-info/15 text-info",
  triagem: "bg-warning/15 text-warning",
  encaminhada: "bg-accent text-accent-foreground",
  em_andamento: "bg-primary/15 text-primary",
  resolvida: "bg-success/15 text-success",
  arquivada: "bg-muted text-muted-foreground",
};

export const origemLabels: Record<string, string> = {
  visita: "Visita", telefone: "Telefone", whatsapp: "WhatsApp", gabinete: "Gabinete", evento: "Evento", rede_social: "Rede Social",
};

export interface DemandasFilters {
  status?: string;
  prioridade?: string;
  categoria?: string;
  origem?: string;
  search?: string;
  vencidas?: boolean;
  semResponsavel?: boolean;
  municipioId?: string;
}

// ---- DEMANDAS ----
export function useDemandas(filters: DemandasFilters = {}) {
  return useQuery({
    queryKey: ["demandas", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.prioridade) params.append("prioridade", filters.prioridade);
      if (filters.categoria) params.append("categoria", filters.categoria);
      if (filters.origem) params.append("origem", filters.origem);
      if (filters.municipioId) params.append("municipioId", filters.municipioId);
      if (filters.semResponsavel) params.append("semResponsavel", String(filters.semResponsavel));
      if (filters.search) params.append("search", filters.search);
      if (filters.vencidas) params.append("vencidas", String(filters.vencidas));

      const queryStr = params.toString();
      return api.get<any[]>(`/demandas${queryStr ? `?${queryStr}` : ''}`);
    },
  });
}

export function useDemandasStats() {
  return useQuery({
    queryKey: ["demandas-stats"],
    queryFn: async () => {
      return api.get<any>('/demandas/stats');
    },
  });
}

export function useDemanda(id?: string) {
  return useQuery({
    queryKey: ["demanda", id],
    queryFn: async () => {
      if (!id) return null;
      return api.get<any>(`/demandas/${id}`);
    },
    enabled: !!id,
  });
}

export function useCreateDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      let dataPrazo = values.dataPrazo;
      if (!dataPrazo && values.prioridade) {
        const days = prioridadeSLA[values.prioridade] ?? 15;
        const d = new Date();
        d.setDate(d.getDate() + days);
        dataPrazo = d.toISOString();
      }
      return api.post<any>('/demandas', { ...values, dataPrazo });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demandas"] });
      qc.invalidateQueries({ queryKey: ["demandas-stats"] });
    },
  });
}

export function useUpdateDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: any) => {
      return api.patch<any>(`/demandas/${id}`, values);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["demandas"] });
      qc.invalidateQueries({ queryKey: ["demanda", vars.id] });
      qc.invalidateQueries({ queryKey: ["demandas-stats"] });
    },
  });
}

export function useDeleteDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<void>(`/demandas/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demandas"] });
      qc.invalidateQueries({ queryKey: ["demandas-stats"] });
    },
  });
}

// ---- ENCAMINHAMENTOS ----
export function useEncaminhamentos(demandaId?: string) {
  return useQuery({
    queryKey: ["demandas_encaminhamentos", demandaId],
    queryFn: async () => {
      return api.get<any[]>(`/demandas/${demandaId}/encaminhamentos`);
    },
    enabled: !!demandaId,
  });
}

export function useCreateEncaminhamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { demandaId: string; paraUsuarioId?: string; observacao?: string }) => {
      const { demandaId, ...data } = values;
      return api.post<any>(`/demandas/${demandaId}/encaminhamentos`, data);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["demandas_encaminhamentos", v.demandaId] }),
  });
}

// ---- ANEXOS ----
export function useAnexos(demandaId?: string) {
  return useQuery({
    queryKey: ["demandas_anexos", demandaId],
    queryFn: async () => {
      return api.get<any[]>(`/demandas/${demandaId}/anexos`);
    },
    enabled: !!demandaId,
  });
}

export function useCreateAnexo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { demandaId: string; arquivoUrl: string; descricao?: string; tipo?: string }) => {
      const { demandaId, ...data } = values;
      return api.post<any>(`/demandas/${demandaId}/anexos`, data);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["demandas_anexos", v.demandaId] }),
  });
}
