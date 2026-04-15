import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type TipoAgenda = "visita" | "evento" | "reuniao" | "comicio" | "carreata" | "porta_a_porta" | "audiencia" | "retorno";
type StatusAgenda = "planejado" | "confirmado" | "em_andamento" | "realizado" | "cancelado";
type PapelParticipante = "organizador" | "palestrante" | "convidado" | "equipe";
type TipoCheckin = "checkin" | "checkout";

export const tipoAgendaLabels: Record<string, string> = {
  visita: "Visita", evento: "Evento", reuniao: "Reunião", comicio: "Comício",
  carreata: "Carreata", porta_a_porta: "Porta a Porta", audiencia: "Audiência", retorno: "Retorno",
};

export const statusAgendaLabels: Record<string, string> = {
  planejado: "Planejado", confirmado: "Confirmado", em_andamento: "Em Andamento", realizado: "Realizado", cancelado: "Cancelado",
};
export const statusAgendaColors: Record<string, string> = {
  planejado: "bg-blue-500/15 text-blue-400", confirmado: "bg-green-500/15 text-green-400",
  em_andamento: "bg-orange-500/15 text-orange-400", realizado: "bg-gray-500/15 text-gray-300", cancelado: "bg-red-500/15 text-red-400",
};

export const papelParticipanteLabels: Record<string, string> = {
  organizador: "Organizador", palestrante: "Palestrante", convidado: "Convidado", equipe: "Equipe",
};

// ---- AGENDA ----
export function useAgendaItems(month?: string) {
  return useQuery({
    queryKey: ["agenda", month],
    queryFn: async () => {
      let q = supabase.from("agenda").select("*, municipios(nome), bairros(nome)").order("data_inicio").limit(300);
      if (month) {
        const start = `${month}-01T00:00:00`;
        const end = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0);
        q = q.gte("data_inicio", start).lte("data_inicio", `${month}-${end.getDate()}T23:59:59`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAgendaItem(id?: string) {
  return useQuery({
    queryKey: ["agenda_item", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("agenda").select("*, municipios(nome), bairros(nome)").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAgenda() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: {
      titulo: string; tipo: TipoAgenda; data_inicio: string; data_fim?: string;
      local?: string; endereco?: string; municipio_id?: string; bairro_id?: string;
      responsavel_id?: string; descricao?: string; observacoes?: string;
    }) => {
      const { data, error } = await supabase.from("agenda").insert({ ...values, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda"] }),
  });
}

export function useUpdateAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: {
      id: string; titulo?: string; tipo?: TipoAgenda; status?: StatusAgenda;
      data_inicio?: string; data_fim?: string; local?: string; descricao?: string;
    }) => {
      const { data, error } = await supabase.from("agenda").update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["agenda"] });
      qc.invalidateQueries({ queryKey: ["agenda_item", vars.id] });
    },
  });
}

export function useDeleteAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agenda").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda"] }),
  });
}

// ---- PARTICIPANTES ----
export function useParticipantes(agendaId?: string) {
  return useQuery({
    queryKey: ["agenda_participantes", agendaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("agenda_participantes").select("*, pessoas(full_name)").eq("agenda_id", agendaId!).order("created_at");
      if (error) throw error;
      return data || [];
    },
    enabled: !!agendaId,
  });
}

export function useCreateParticipante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { agenda_id: string; pessoa_id: string; papel?: PapelParticipante }) => {
      const { data, error } = await supabase.from("agenda_participantes").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["agenda_participantes", v.agenda_id] }),
  });
}

export function useUpdateParticipante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agendaId, ...values }: { id: string; agendaId: string; confirmado?: boolean; presente?: boolean }) => {
      const { error } = await supabase.from("agenda_participantes").update(values).eq("id", id);
      if (error) throw error;
      return agendaId;
    },
    onSuccess: (agendaId) => qc.invalidateQueries({ queryKey: ["agenda_participantes", agendaId] }),
  });
}

export function useDeleteParticipante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agendaId }: { id: string; agendaId: string }) => {
      const { error } = await supabase.from("agenda_participantes").delete().eq("id", id);
      if (error) throw error;
      return agendaId;
    },
    onSuccess: (agendaId) => qc.invalidateQueries({ queryKey: ["agenda_participantes", agendaId] }),
  });
}

// ---- CHECKINS ----
export function useCheckins(agendaId?: string) {
  return useQuery({
    queryKey: ["agenda_checkins", agendaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("agenda_checkins").select("*").eq("agenda_id", agendaId!).order("created_at");
      if (error) throw error;
      return data || [];
    },
    enabled: !!agendaId,
  });
}

export function useCreateCheckin() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { agenda_id: string; tipo: TipoCheckin; latitude?: number; longitude?: number }) => {
      const { data, error } = await supabase.from("agenda_checkins").insert({ ...values, usuario_id: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["agenda_checkins", v.agenda_id] }),
  });
}

// ---- FOLLOWUPS ----
export function useFollowups(agendaId?: string) {
  return useQuery({
    queryKey: ["agenda_followups", agendaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("agenda_followups").select("*").eq("agenda_id", agendaId!).order("prazo");
      if (error) throw error;
      return data || [];
    },
    enabled: !!agendaId,
  });
}

export function useCreateFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { agenda_id: string; descricao: string; responsavel_id?: string; prazo?: string }) => {
      const { data, error } = await supabase.from("agenda_followups").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["agenda_followups", v.agenda_id] }),
  });
}

export function useUpdateFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agendaId, ...values }: { id: string; agendaId: string; concluido?: boolean }) => {
      const { error } = await supabase.from("agenda_followups").update(values).eq("id", id);
      if (error) throw error;
      return agendaId;
    },
    onSuccess: (agendaId) => qc.invalidateQueries({ queryKey: ["agenda_followups", agendaId] }),
  });
}
