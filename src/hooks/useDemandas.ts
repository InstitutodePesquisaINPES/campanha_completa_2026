import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type CategoriaDemanda = "saude" | "educacao" | "infraestrutura" | "seguranca" | "social" | "emprego" | "moradia" | "transporte" | "outros";
type PrioridadeDemanda = "baixa" | "media" | "alta" | "urgente";
type StatusDemanda = "aberta" | "triagem" | "encaminhada" | "em_andamento" | "resolvida" | "arquivada";
type OrigemDemanda = "visita" | "telefone" | "whatsapp" | "gabinete" | "evento" | "rede_social";

export const categoriaLabels: Record<string, string> = {
  saude: "Saúde", educacao: "Educação", infraestrutura: "Infraestrutura", seguranca: "Segurança",
  social: "Social", emprego: "Emprego", moradia: "Moradia", transporte: "Transporte", outros: "Outros",
};

export const prioridadeLabels: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };
export const prioridadeColors: Record<string, string> = {
  baixa: "bg-gray-500/15 text-gray-400", media: "bg-blue-500/15 text-blue-400",
  alta: "bg-orange-500/15 text-orange-400", urgente: "bg-red-500/15 text-red-400",
};

export const statusLabels: Record<string, string> = {
  aberta: "Aberta", triagem: "Triagem", encaminhada: "Encaminhada",
  em_andamento: "Em Andamento", resolvida: "Resolvida", arquivada: "Arquivada",
};
export const statusColors: Record<string, string> = {
  aberta: "bg-blue-500/15 text-blue-400", triagem: "bg-yellow-500/15 text-yellow-400",
  encaminhada: "bg-purple-500/15 text-purple-400", em_andamento: "bg-orange-500/15 text-orange-400",
  resolvida: "bg-green-500/15 text-green-400", arquivada: "bg-gray-500/15 text-gray-400",
};

export const origemLabels: Record<string, string> = {
  visita: "Visita", telefone: "Telefone", whatsapp: "WhatsApp", gabinete: "Gabinete", evento: "Evento", rede_social: "Rede Social",
};

// ---- DEMANDAS ----
export function useDemandas(status?: string, prioridade?: string) {
  return useQuery({
    queryKey: ["demandas", status, prioridade],
    queryFn: async () => {
      let q = supabase.from("demandas").select("*, pessoas(full_name), municipios(nome), bairros(nome)").order("data_abertura", { ascending: false }).limit(300);
      if (status && status !== "all") q = q.eq("status", status as StatusDemanda);
      if (prioridade && prioridade !== "all") q = q.eq("prioridade", prioridade as PrioridadeDemanda);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useDemanda(id?: string) {
  return useQuery({
    queryKey: ["demanda", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("demandas").select("*, pessoas(full_name), municipios(nome), bairros(nome)").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateDemanda() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: {
      titulo: string; descricao?: string; pessoa_id?: string;
      categoria?: CategoriaDemanda; prioridade?: PrioridadeDemanda;
      origem?: OrigemDemanda; municipio_id?: string; bairro_id?: string;
      responsavel_id?: string;
    }) => {
      const { data, error } = await supabase.from("demandas")
        .insert({ ...values, protocolo: "TEMP", created_by: user?.id })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandas"] }),
  });
}

export function useUpdateDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: {
      id: string; titulo?: string; descricao?: string; categoria?: CategoriaDemanda;
      prioridade?: PrioridadeDemanda; status?: StatusDemanda; responsavel_id?: string;
      resolucao_descricao?: string; satisfacao_cidadao?: number; data_resolucao?: string;
    }) => {
      const { data, error } = await supabase.from("demandas").update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["demandas"] });
      qc.invalidateQueries({ queryKey: ["demanda", vars.id] });
    },
  });
}

export function useDeleteDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("demandas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandas"] }),
  });
}

// ---- ENCAMINHAMENTOS ----
export function useEncaminhamentos(demandaId?: string) {
  return useQuery({
    queryKey: ["demandas_encaminhamentos", demandaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("demandas_encaminhamentos").select("*").eq("demanda_id", demandaId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!demandaId,
  });
}

export function useCreateEncaminhamento() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { demanda_id: string; para_usuario_id?: string; observacao?: string }) => {
      const { data, error } = await supabase.from("demandas_encaminhamentos").insert({ ...values, de_usuario_id: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["demandas_encaminhamentos", v.demanda_id] }),
  });
}
