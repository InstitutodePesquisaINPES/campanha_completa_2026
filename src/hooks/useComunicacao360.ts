import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PautaStatus = "ideia" | "aprovada" | "em_producao" | "agendada" | "publicada" | "cancelada";
export type PautaCanal = "instagram" | "facebook" | "tiktok" | "youtube" | "whatsapp" | "site" | "imprensa" | "radio" | "tv" | "outdoor" | "outros";
export type PecaStatus = "rascunho" | "em_revisao" | "aprovacao_juridica" | "aprovada" | "reprovada" | "publicada";
export type PecaTipo = "post" | "video" | "reels" | "story" | "jingle" | "santinho" | "adesivo" | "outdoor" | "release" | "spot" | "outros";
export type MencaoCanal = "instagram" | "facebook" | "twitter" | "tiktok" | "youtube" | "whatsapp" | "imprensa" | "blog" | "grupo" | "outros";
export type MencaoSentimento = "positivo" | "neutro" | "negativo" | "crise";
export type MencaoStatus = "novo" | "em_analise" | "respondido" | "escalado" | "arquivado";

export type Pauta = {
  id: string;
  campanha_id: string | null;
  titulo: string;
  descricao: string | null;
  canal: PautaCanal;
  status: PautaStatus;
  data_publicacao: string | null;
  responsavel_id: string | null;
  tags: string[] | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type Peca = {
  id: string;
  pauta_id: string | null;
  campanha_id: string | null;
  titulo: string;
  tipo: PecaTipo;
  status: PecaStatus;
  arquivo_url: string | null;
  thumbnail_url: string | null;
  texto_legenda: string | null;
  aprovador_id: string | null;
  aprovado_em: string | null;
  observacoes_juridicas: string | null;
  versao: number;
  created_at: string;
  updated_at: string;
};

export type Mencao = {
  id: string;
  campanha_id: string | null;
  canal: MencaoCanal;
  autor: string | null;
  url: string | null;
  conteudo: string;
  sentimento: MencaoSentimento;
  status: MencaoStatus;
  alcance_estimado: number | null;
  resposta: string | null;
  respondido_por: string | null;
  respondido_em: string | null;
  data_mencao: string;
  created_at: string;
  updated_at: string;
};

export type WarRoomKPIs = {
  mencoes_novas: number;
  crises_ativas: number;
  negativas_24h: number;
  positivas_24h: number;
  total_7d: number;
};

const sb = supabase as any;

export function usePautas() {
  return useQuery({
    queryKey: ["pautas"],
    queryFn: async () => {
      const { data, error } = await sb.from("comunicacao_pautas").select("*").order("data_publicacao", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data || []) as Pauta[];
    },
  });
}

export function useCreatePauta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Pauta>) => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await sb.from("comunicacao_pautas").insert({ ...input, created_by: u.user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pautas"] }); toast.success("Pauta criada"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdatePauta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<Pauta>) => {
      const { error } = await sb.from("comunicacao_pautas").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pautas"] }); toast.success("Pauta atualizada"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function usePecas() {
  return useQuery({
    queryKey: ["pecas"],
    queryFn: async () => {
      const { data, error } = await sb.from("comunicacao_pecas").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Peca[];
    },
  });
}

export function useCreatePeca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Peca>) => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await sb.from("comunicacao_pecas").insert({ ...input, created_by: u.user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pecas"] }); toast.success("Peça criada"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdatePecaStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, observacoes_juridicas }: { id: string; status: PecaStatus; observacoes_juridicas?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const patch: any = { status };
      if (status === "aprovada") {
        patch.aprovador_id = u.user?.id;
        patch.aprovado_em = new Date().toISOString();
      }
      if (observacoes_juridicas !== undefined) patch.observacoes_juridicas = observacoes_juridicas;
      const { error } = await sb.from("comunicacao_pecas").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pecas"] }); toast.success("Status atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useMencoes() {
  return useQuery({
    queryKey: ["mencoes"],
    queryFn: async () => {
      const { data, error } = await sb.from("comunicacao_mencoes").select("*").order("data_mencao", { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []) as Mencao[];
    },
  });
}

export function useCreateMencao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Mencao>) => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await sb.from("comunicacao_mencoes").insert({ ...input, created_by: u.user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mencoes"] }); qc.invalidateQueries({ queryKey: ["warroom-kpis"] }); toast.success("Menção registrada"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useResponderMencao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resposta, status }: { id: string; resposta: string; status: MencaoStatus }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await sb.from("comunicacao_mencoes").update({
        resposta, status,
        respondido_por: u.user?.id,
        respondido_em: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mencoes"] }); qc.invalidateQueries({ queryKey: ["warroom-kpis"] }); toast.success("Resposta registrada"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useWarRoomKPIs() {
  return useQuery({
    queryKey: ["warroom-kpis"],
    queryFn: async () => {
      const { data, error } = await sb.from("v_warroom_kpis").select("*").maybeSingle();
      if (error) throw error;
      return (data || { mencoes_novas: 0, crises_ativas: 0, negativas_24h: 0, positivas_24h: 0, total_7d: 0 }) as WarRoomKPIs;
    },
    refetchInterval: 30000,
  });
}
