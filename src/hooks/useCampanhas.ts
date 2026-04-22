import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type Campanha = Database["public"]["Tables"]["campanhas"]["Row"];
export type CampanhaInsert = Database["public"]["Tables"]["campanhas"]["Insert"];
export type Tarefa = Database["public"]["Tables"]["campanha_tarefas"]["Row"];
export type Fase = Database["public"]["Tables"]["campanha_fases"]["Row"];
export type Meta = Database["public"]["Tables"]["campanha_metas"]["Row"];
export type Semana = Database["public"]["Tables"]["campanha_semanas"]["Row"];

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
      const { data, error } = await supabase
        .from("campanhas")
        .select("*, municipios(nome), estados(sigla, nome), pessoas(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCampanha(id?: string) {
  return useQuery({
    queryKey: ["campanha", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanhas")
        .select("*, municipios(nome), estados(sigla, nome), pessoas(full_name)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
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
      const { data, error } = await supabase
        .from("campanhas")
        .select("*, municipios(nome), estados(sigla, nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;

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
      const { data, error } = await supabase
        .from("campanhas")
        .select("*")
        .eq("ativa", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useFases(campanhaId?: string) {
  return useQuery({
    queryKey: ["fases", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanha_fases")
        .select("*")
        .eq("campanha_id", campanhaId!)
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });
}

export function useTarefas(campanhaId?: string) {
  return useQuery({
    queryKey: ["tarefas", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanha_tarefas")
        .select("*")
        .eq("campanha_id", campanhaId!)
        .order("dia")
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });
}

export function useMetas(campanhaId?: string) {
  return useQuery({
    queryKey: ["metas", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanha_metas")
        .select("*")
        .eq("campanha_id", campanhaId!)
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });
}

export function useSemanas(campanhaId?: string) {
  return useQuery({
    queryKey: ["semanas", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanha_semanas")
        .select("*")
        .eq("campanha_id", campanhaId!)
        .order("numero_semana");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCampanha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CampanhaInsert) => {
      const { data, error } = await supabase
        .from("campanhas")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      const { error: rpcError } = await supabase.rpc("gerar_plano_90_dias" as never, {
        _campanha_id: data.id,
      } as never);
      if (rpcError) throw rpcError;
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
      const { data, error } = await supabase
        .from("campanhas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
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
      const { data, error } = await supabase
        .from("campanha_tarefas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Database["public"]["Tables"]["campanha_tarefas"]["Insert"]) => {
      const { data, error } = await supabase.from("campanha_tarefas").insert(input).select().single();
      if (error) throw error;
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
      const { error } = await supabase.from("campanha_tarefas").delete().eq("id", id);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from("campanha_metas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metas"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Database["public"]["Tables"]["campanha_metas"]["Insert"]) => {
      const { data, error } = await supabase.from("campanha_metas").insert(input).select().single();
      if (error) throw error;
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
      const { error } = await supabase.from("campanha_metas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metas"] });
      toast.success("Meta removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
