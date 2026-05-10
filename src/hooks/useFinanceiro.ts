import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

export type CategoriaDespesa = "pessoal" | "material" | "transporte" | "alimentacao" | "comunicacao" | "evento" | "juridico" | "outros";
export type StatusDespesa = "pendente" | "aprovada" | "paga" | "cancelada";
export type TipoReceita = "doacao" | "fundo_partidario" | "recursos_proprios" | "outros";

export const categoriaDespesaLabels: Record<string, string> = {
  pessoal: "Pessoal", material: "Material", transporte: "Transporte", alimentacao: "Alimentação",
  comunicacao: "Comunicação", evento: "Evento", juridico: "Jurídico", outros: "Outros",
};

export const statusDespesaLabels: Record<string, string> = { pendente: "Pendente", aprovada: "Aprovada", paga: "Paga", cancelada: "Cancelada" };
export const statusDespesaColors: Record<string, string> = {
  pendente: "bg-yellow-500/15 text-yellow-400", aprovada: "bg-blue-500/15 text-blue-400",
  paga: "bg-green-500/15 text-green-400", cancelada: "bg-red-500/15 text-red-400",
};

export const tipoReceitaLabels: Record<string, string> = {
  doacao: "Doação", fundo_partidario: "Fundo Partidário", recursos_proprios: "Recursos Próprios", outros: "Outros",
};

// ---- CENTROS DE CUSTO ----
export function useCentrosCusto() {
  return useQuery({
    queryKey: ["centros_custo"],
    queryFn: async () => {
      return api.get<any[]>('/financeiro/centros-custo');
    },
  });
}

export function useCreateCentroCusto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nome: string; descricao?: string; orcamentoPrevisto?: number }) => {
      return api.post<any>('/financeiro/centros-custo', values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["centros_custo"] }),
  });
}

export function useDeleteCentroCusto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<void>(`/financeiro/centros-custo/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["centros_custo"] }),
  });
}

// ---- DESPESAS ----
export function useDespesas(centroCustoId?: string) {
  return useQuery({
    queryKey: ["despesas", centroCustoId],
    queryFn: async () => {
      return api.get<any[]>(`/financeiro/despesas${centroCustoId && centroCustoId !== 'all' ? `?centroCustoId=${centroCustoId}` : ''}`);
    },
  });
}

export function useCreateDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      descricao: string; valor: number; categoria?: CategoriaDespesa; centroCustoId?: string;
      dataDespesa?: string; fornecedorId?: string; documentoTipo?: string; documentoNumero?: string;
    }) => {
      return api.post<any>('/financeiro/despesas', values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["despesas"] }),
  });
}

export function useUpdateDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; status?: StatusDespesa; aprovadorId?: string; dataPagamento?: string }) => {
      return api.patch<any>(`/financeiro/despesas/${id}`, values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["despesas"] }),
  });
}

export function useDeleteDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<void>(`/financeiro/despesas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["despesas"] }),
  });
}

// ---- RECEITAS ----
export function useReceitas(centroCustoId?: string) {
  return useQuery({
    queryKey: ["receitas", centroCustoId],
    queryFn: async () => {
      return api.get<any[]>(`/financeiro/receitas${centroCustoId && centroCustoId !== 'all' ? `?centroCustoId=${centroCustoId}` : ''}`);
    },
  });
}

export function useCreateReceita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { valor: number; tipo?: TipoReceita; centroCustoId?: string; descricao?: string; dataReceita?: string; origemPessoaId?: string }) => {
      return api.post<any>('/financeiro/receitas', values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["receitas"] }),
  });
}

export function useDeleteReceita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<void>(`/financeiro/receitas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["receitas"] }),
  });
}
