import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";


export type Campanha = any;
export type CampanhaInsert = any;
export type Tarefa = any;
export type Fase = any;
export type Meta = any;
export type Semana = any;

const normalizarTexto = (value?: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .trim();

export function useCampanhas() {
  return useQuery({
    queryKey: ["campanhas"],
    queryFn: async () => {
      const data = await api.get<Campanha[]>("/campanhas");
      return data || [];
    },
  });
}

export function useCampanha(id?: string) {
  return useQuery({
    queryKey: ["campanha", id],
    enabled: !!id,
    queryFn: async () => {
      const data = await api.get<Campanha>(`/campanhas/${id}`);
      return data;
    },
  });
}

export function useCampanhaRelacionadaAoCandidato(input?: {
  nome?: string | null;
  numeroUrna?: string | null;
  cargo?: string | null;
  ano?: number | null;
}) {
  return useQuery({
    queryKey: ["campanha-relacionada-candidato", input?.nome, input?.numeroUrna, input?.cargo, input?.ano],
    enabled: !!(input?.nome || input?.numeroUrna),
    queryFn: async () => {
      const data = await api.get<Campanha[]>("/campanhas");
      
      const nome = normalizarTexto(input?.nome);
      const cargo = normalizarTexto(input?.cargo);

      return (data ?? []).find((campanha) => {
        const campanhaAno = campanha.data_eleicao ? new Date(campanha.data_eleicao).getFullYear() : null;
        const matchNumero = input?.numeroUrna ? campanha.numero_urna === input.numeroUrna : false;
        const nomeCampanha = normalizarTexto(campanha.nome);
        const matchNome = nome ? nomeCampanha.includes(nome) || nome.includes(nomeCampanha) : false;
        const cargoCampanha = normalizarTexto(campanha.cargo);
        const matchCargo = cargo ? cargoCampanha.includes(cargo) || cargo.includes(cargoCampanha) : true;
        const matchAno = input?.ano ? campanhaAno === input.ano : true;
        return (matchNumero || matchNome) && matchCargo && matchAno;
      }) ?? null;
    },
  });
}

export function useCampanhaAtiva() {
  return useQuery({
    queryKey: ["campanha-ativa"],
    queryFn: async () => {
      const data = await api.get<Campanha>("/campanhas/ativa");
      return data;
    },
  });
}

export function useFases(campanhaId?: string) {
  return useQuery({
    queryKey: ["fases", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const data = await api.get<Fase[]>(`/campanhas/${campanhaId}/fases`);
      return data || [];
    },
  });
}

export function useTarefas(campanhaId?: string) {
  return useQuery({
    queryKey: ["tarefas", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const data = await api.get<Tarefa[]>(`/campanhas/${campanhaId}/tarefas`);
      return data || [];
    },
  });
}

export function useMetas(campanhaId?: string) {
  return useQuery({
    queryKey: ["metas", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const data = await api.get<Meta[]>(`/campanhas/${campanhaId}/metas`);
      return data || [];
    },
  });
}

export function useSemanas(campanhaId?: string) {
  return useQuery({
    queryKey: ["semanas", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const data = await api.get<Semana[]>(`/campanhas/${campanhaId}/semanas`);
      return data || [];
    },
  });
}

export function useCreateCampanha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CampanhaInsert) => {
      const data = await api.post<Campanha>("/campanhas", input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campanhas"] });
      qc.invalidateQueries({ queryKey: ["campanha-ativa"] });
      qc.invalidateQueries({ queryKey: ["tse-candidatos"] });
      toast.success("Campanha criada com plano 90 dias gerado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCampanha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campanha> & { id: string }) => {
      const data = await api.put<Campanha>(`/campanhas/${id}`, updates);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["campanhas"] });
      qc.invalidateQueries({ queryKey: ["campanha", vars.id] });
      qc.invalidateQueries({ queryKey: ["campanha-ativa"] });
      qc.invalidateQueries({ queryKey: ["campanha-relacionada-candidato"] });
      qc.invalidateQueries({ queryKey: ["tse-candidatos"] });
      toast.success("Candidato atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tarefa> & { id: string }) => {
      const data = await api.put<Tarefa>(`/campanhas/tarefas/${id}`, updates);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const data = await api.post<Tarefa>(`/campanhas/${input.campanha_id}/tarefas`, input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tarefas"] });
      toast.success("Tarefa adicionada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/campanhas/tarefas/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tarefas"] });
      toast.success("Tarefa removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Meta> & { id: string }) => {
      const data = await api.put<Meta>(`/campanhas/metas/${id}`, updates);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metas"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const data = await api.post<Meta>(`/campanhas/${input.campanha_id}/metas`, input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metas"] });
      toast.success("Meta adicionada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/campanhas/metas/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metas"] });
      toast.success("Meta removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
