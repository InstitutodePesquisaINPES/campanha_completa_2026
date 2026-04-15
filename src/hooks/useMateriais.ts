import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type TipoMaterial = "grafico" | "brinde" | "camiseta" | "adesivo" | "banner" | "santinho" | "outros";
type TipoMovimentacao = "entrada" | "saida" | "transferencia" | "perda";

export const tipoMaterialLabels: Record<string, string> = {
  grafico: "Gráfico", brinde: "Brinde", camiseta: "Camiseta", adesivo: "Adesivo",
  banner: "Banner", santinho: "Santinho", outros: "Outros",
};

export const tipoMovimentacaoLabels: Record<string, string> = {
  entrada: "Entrada", saida: "Saída", transferencia: "Transferência", perda: "Perda",
};

// ---- MATERIAIS ----
export function useMateriais() {
  return useQuery({
    queryKey: ["materiais"],
    queryFn: async () => {
      const { data, error } = await supabase.from("materiais").select("*").order("nome");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nome: string; tipo?: TipoMaterial; descricao?: string; custo_unitario?: number }) => {
      const { data, error } = await supabase.from("materiais").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materiais"] }),
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("materiais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materiais"] }),
  });
}

// ---- ESTOQUES ----
export function useEstoques() {
  return useQuery({
    queryKey: ["estoques"],
    queryFn: async () => {
      const { data, error } = await supabase.from("estoques").select("*, materiais(nome, tipo), municipios(nome)").order("created_at");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateEstoque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { material_id: string; centro_distribuicao?: string; quantidade_atual?: number; quantidade_minima?: number; municipio_id?: string }) => {
      const { data, error } = await supabase.from("estoques").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["estoques"] }),
  });
}

// ---- MOVIMENTAÇÕES ----
export function useMovimentacoes(estoqueId?: string) {
  return useQuery({
    queryKey: ["movimentacoes_estoque", estoqueId],
    queryFn: async () => {
      const { data, error } = await supabase.from("movimentacoes_estoque").select("*").eq("estoque_id", estoqueId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!estoqueId,
  });
}

export function useCreateMovimentacao() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { estoque_id: string; tipo: TipoMovimentacao; quantidade: number; motivo?: string }) => {
      const { data, error } = await supabase.from("movimentacoes_estoque").insert({ ...values, responsavel_id: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["movimentacoes_estoque", v.estoque_id] });
      qc.invalidateQueries({ queryKey: ["estoques"] });
    },
  });
}
