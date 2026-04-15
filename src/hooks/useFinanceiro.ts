import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type CategoriaDespesa = "pessoal" | "material" | "transporte" | "alimentacao" | "comunicacao" | "evento" | "juridico" | "outros";
type StatusDespesa = "pendente" | "aprovada" | "paga" | "cancelada";
type TipoReceita = "doacao" | "fundo_partidario" | "recursos_proprios" | "outros";

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
      const { data, error } = await supabase.from("centros_custo").select("*").order("nome");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateCentroCusto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nome: string; descricao?: string; orcamento_previsto?: number }) => {
      const { data, error } = await supabase.from("centros_custo").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["centros_custo"] }),
  });
}

export function useDeleteCentroCusto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("centros_custo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["centros_custo"] }),
  });
}

// ---- DESPESAS ----
export function useDespesas(centroCustoId?: string) {
  return useQuery({
    queryKey: ["despesas", centroCustoId],
    queryFn: async () => {
      let q = supabase.from("despesas").select("*, centros_custo(nome), pessoas(full_name)").order("data_despesa", { ascending: false }).limit(300);
      if (centroCustoId && centroCustoId !== "all") q = q.eq("centro_custo_id", centroCustoId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateDespesa() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: {
      descricao: string; valor: number; categoria?: CategoriaDespesa; centro_custo_id?: string;
      data_despesa?: string; fornecedor_pessoa_id?: string; documento_tipo?: string; documento_numero?: string;
    }) => {
      const { data, error } = await supabase.from("despesas").insert({ ...values, responsavel_id: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["despesas"] }),
  });
}

export function useUpdateDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; status?: StatusDespesa; aprovador_id?: string; data_pagamento?: string }) => {
      const { data, error } = await supabase.from("despesas").update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["despesas"] }),
  });
}

export function useDeleteDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["despesas"] }),
  });
}

// ---- RECEITAS ----
export function useReceitas(centroCustoId?: string) {
  return useQuery({
    queryKey: ["receitas", centroCustoId],
    queryFn: async () => {
      let q = supabase.from("receitas").select("*, centros_custo(nome), pessoas(full_name)").order("data", { ascending: false }).limit(300);
      if (centroCustoId && centroCustoId !== "all") q = q.eq("centro_custo_id", centroCustoId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateReceita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { valor: number; tipo?: TipoReceita; centro_custo_id?: string; descricao?: string; data?: string; origem_pessoa_id?: string }) => {
      const { data, error } = await supabase.from("receitas").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["receitas"] }),
  });
}

export function useDeleteReceita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receitas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["receitas"] }),
  });
}
