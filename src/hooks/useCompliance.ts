import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await (supabase as any)
        .from("contratos")
        .select("*")
        .order("data_fim", { ascending: true });
      if (error) throw error;
      return (data || []) as Contrato[];
    },
  });
}

export function useContratosAlerta() {
  return useQuery({
    queryKey: ["contratos-alerta"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_contratos_alerta")
        .select("*")
        .order("dias_para_vencer", { ascending: true });
      if (error) throw error;
      return (data || []) as (Contrato & { dias_para_vencer: number })[];
    },
  });
}

export function useUpsertContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Contrato> & { objeto: string; data_inicio: string; data_fim: string }) => {
      const { id, ...rest } = input as any;
      if (id) {
        const { data, error } = await (supabase as any).from("contratos").update(rest).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await (supabase as any).from("contratos").insert(rest).select().single();
      if (error) throw error;
      return data;
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
      const { error } = await (supabase as any).from("contratos").delete().eq("id", id);
      if (error) throw error;
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
      const { data, error } = await (supabase as any)
        .from("riscos")
        .select("*")
        .order("severidade", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Risco[];
    },
  });
}

export function useUpsertRisco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Risco> & { titulo: string; categoria: Risco["categoria"] }) => {
      const { id, ...rest } = input as any;
      if (id) {
        const { data, error } = await (supabase as any).from("riscos").update(rest).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await (supabase as any).from("riscos").insert(rest).select().single();
      if (error) throw error;
      return data;
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
      const { error } = await (supabase as any).from("riscos").delete().eq("id", id);
      if (error) throw error;
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
      const { data, error } = await (supabase as any)
        .from("incidentes")
        .select("*")
        .order("data_ocorrencia", { ascending: false });
      if (error) throw error;
      return (data || []) as Incidente[];
    },
  });
}

export function useUpsertIncidente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Incidente> & { titulo: string; categoria: Risco["categoria"] }) => {
      const { id, ...rest } = input as any;
      if (id) {
        const { data, error } = await (supabase as any).from("incidentes").update(rest).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await (supabase as any).from("incidentes").insert(rest).select().single();
      if (error) throw error;
      return data;
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
      const { error } = await (supabase as any).from("incidentes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidentes"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
