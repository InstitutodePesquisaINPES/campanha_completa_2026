import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

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
      return api.get<any[]>(`/agenda${month ? `?month=${month}` : ''}`);
    },
  });
}

export function useAgendaItem(id?: string) {
  return useQuery({
    queryKey: ["agenda_item", id],
    queryFn: async () => {
      if (!id) return null;
      return api.get<any>(`/agenda/${id}`);
    },
    enabled: !!id,
  });
}

export function useCreateAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      return api.post<any>('/agenda', values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda"] }),
  });
}

export function useUpdateAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & any) => {
      return api.patch<any>(`/agenda/${id}`, values);
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
      return api.delete<void>(`/agenda/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda"] }),
  });
}

// ---- PARTICIPANTES ----
export function useParticipantes(agendaId?: string) {
  return useQuery({
    queryKey: ["agenda_participantes", agendaId],
    queryFn: async () => {
      return api.get<any[]>(`/agenda/${agendaId}/participantes`);
    },
    enabled: !!agendaId,
  });
}

export function useCreateParticipante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { agendaId: string; pessoaId: string; papel?: PapelParticipante }) => {
      const { agendaId, ...data } = values;
      return api.post<any>(`/agenda/${agendaId}/participantes`, data);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["agenda_participantes", v.agendaId] }),
  });
}

export function useUpdateParticipante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agendaId, ...values }: { id: string; agendaId: string; confirmado?: boolean; compareceu?: boolean }) => {
      await api.patch<any>(`/agenda/participantes/${id}`, values);
      return agendaId;
    },
    onSuccess: (agendaId) => qc.invalidateQueries({ queryKey: ["agenda_participantes", agendaId] }),
  });
}

export function useDeleteParticipante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agendaId }: { id: string; agendaId: string }) => {
      await api.delete<void>(`/agenda/participantes/${id}`);
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
      return api.get<any[]>(`/agenda/${agendaId}/checkins`);
    },
    enabled: !!agendaId,
  });
}

export function useCreateCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { agendaId: string; tipo: TipoCheckin; latitude?: number; longitude?: number }) => {
      const { agendaId, ...data } = values;
      return api.post<any>(`/agenda/${agendaId}/checkins`, data);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["agenda_checkins", v.agendaId] }),
  });
}

// ---- FOLLOWUPS ----
export function useFollowups(agendaId?: string) {
  return useQuery({
    queryKey: ["agenda_followups", agendaId],
    queryFn: async () => {
      return api.get<any[]>(`/agenda/${agendaId}/followups`);
    },
    enabled: !!agendaId,
  });
}

export function useCreateFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { agendaId: string; descricao: string; responsavelId?: string; prazo?: string }) => {
      const { agendaId, ...data } = values;
      return api.post<any>(`/agenda/${agendaId}/followups`, data);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["agenda_followups", v.agendaId] }),
  });
}

export function useUpdateFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agendaId, ...values }: { id: string; agendaId: string; concluido?: boolean }) => {
      await api.patch<any>(`/agenda/followups/${id}`, values);
      return agendaId;
    },
    onSuccess: (agendaId) => qc.invalidateQueries({ queryKey: ["agenda_followups", agendaId] }),
  });
}
