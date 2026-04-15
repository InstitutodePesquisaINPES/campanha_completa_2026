import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ---- ESTADOS ----
export function useEstados() {
  return useQuery({
    queryKey: ["estados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estados")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });
}

// ---- MUNICIPIOS ----
export function useMunicipios(estadoId?: string) {
  return useQuery({
    queryKey: ["municipios", estadoId],
    queryFn: async () => {
      let q = supabase.from("municipios").select("*, estados(nome, sigla)").order("nome");
      if (estadoId) q = q.eq("estado_id", estadoId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateMunicipio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nome: string; estado_id: string; geocodigo_ibge?: string; populacao?: number; eleitorado_total?: number; latitude?: number; longitude?: number }) => {
      const { data, error } = await supabase.from("municipios").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["municipios"] }),
  });
}

export function useUpdateMunicipio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; nome?: string; estado_id?: string; geocodigo_ibge?: string; populacao?: number; eleitorado_total?: number; latitude?: number; longitude?: number }) => {
      const { data, error } = await supabase.from("municipios").update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["municipios"] }),
  });
}

export function useDeleteMunicipio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("municipios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["municipios"] }),
  });
}

// ---- BAIRROS ----
export function useBairros(municipioId?: string) {
  return useQuery({
    queryKey: ["bairros", municipioId],
    queryFn: async () => {
      let q = supabase.from("bairros").select("*, municipios(nome), distritos(nome)").order("nome");
      if (municipioId) q = q.eq("municipio_id", municipioId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateBairro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nome: string; municipio_id: string; distrito_id?: string; classificacao?: string; latitude?: number; longitude?: number }) => {
      const { data, error } = await supabase.from("bairros").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bairros"] }),
  });
}

export function useUpdateBairro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; nome?: string; municipio_id?: string; distrito_id?: string | null; classificacao?: string | null; latitude?: number; longitude?: number }) => {
      const { data, error } = await supabase.from("bairros").update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bairros"] }),
  });
}

export function useDeleteBairro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bairros").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bairros"] }),
  });
}

// ---- ZONAS ELEITORAIS ----
export function useZonas(municipioId?: string) {
  return useQuery({
    queryKey: ["zonas_eleitorais", municipioId],
    queryFn: async () => {
      let q = supabase.from("zonas_eleitorais").select("*, municipios(nome)").order("numero_zona");
      if (municipioId) q = q.eq("municipio_id", municipioId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateZona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { municipio_id: string; numero_zona: number; tribunal_regional?: string }) => {
      const { data, error } = await supabase.from("zonas_eleitorais").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zonas_eleitorais"] }),
  });
}

export function useDeleteZona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("zonas_eleitorais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zonas_eleitorais"] }),
  });
}

// ---- SEÇÕES ELEITORAIS ----
export function useSecoes(zonaId?: string) {
  return useQuery({
    queryKey: ["secoes_eleitorais", zonaId],
    queryFn: async () => {
      let q = supabase.from("secoes_eleitorais").select("*, zonas_eleitorais(numero_zona, municipios(nome))").order("numero_secao");
      if (zonaId) q = q.eq("zona_id", zonaId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!zonaId,
  });
}

export function useCreateSecao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { zona_id: string; numero_secao: number; local_votacao?: string; endereco?: string; eleitores_aptos?: number; latitude?: number; longitude?: number }) => {
      const { data, error } = await supabase.from("secoes_eleitorais").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["secoes_eleitorais"] }),
  });
}

export function useDeleteSecao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("secoes_eleitorais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["secoes_eleitorais"] }),
  });
}

// ---- DISTRITOS ----
export function useDistritos(municipioId?: string) {
  return useQuery({
    queryKey: ["distritos", municipioId],
    queryFn: async () => {
      let q = supabase.from("distritos").select("*").order("nome");
      if (municipioId) q = q.eq("municipio_id", municipioId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!municipioId,
  });
}

// ---- COMUNIDADES ----
export function useComunidades(bairroId?: string) {
  return useQuery({
    queryKey: ["comunidades", bairroId],
    queryFn: async () => {
      let q = supabase.from("comunidades").select("*, bairros(nome)").order("nome");
      if (bairroId) q = q.eq("bairro_id", bairroId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!bairroId,
  });
}

// ---- ÁREAS DE ATUAÇÃO ----
export function useAreasAtuacao(municipioId?: string) {
  return useQuery({
    queryKey: ["areas_atuacao", municipioId],
    queryFn: async () => {
      let q = supabase.from("areas_atuacao").select("*, municipios(nome)").order("nome");
      if (municipioId) q = q.eq("municipio_id", municipioId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateAreaAtuacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nome: string; tipo: string; municipio_id: string; responsavel_id?: string; bairros_ids?: string[]; observacoes?: string }) => {
      const { data, error } = await supabase.from("areas_atuacao").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas_atuacao"] }),
  });
}

export function useDeleteAreaAtuacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("areas_atuacao").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas_atuacao"] }),
  });
}
