import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MapaCenario {
  id: string;
  campanha_id: string | null;
  nome: string;
  descricao: string | null;
  config: any;
  publico: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MapaSetor {
  id: string;
  campanha_id: string | null;
  municipio_id: string | null;
  nome: string;
  tipo: string;
  cor: string;
  geometria: any;
  area_km2: number | null;
  perimetro_km: number | null;
  responsavel_id: string | null;
  observacoes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useMapaCenarios(campanhaId?: string | null) {
  return useQuery({
    queryKey: ["mapa_cenarios", campanhaId ?? "global"],
    queryFn: async () => {
      let q = supabase.from("mapa_cenarios").select("*").order("updated_at", { ascending: false });
      if (campanhaId) q = q.or(`campanha_id.eq.${campanhaId},campanha_id.is.null`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as MapaCenario[];
    },
  });
}

export function useSaveCenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<MapaCenario> & { nome: string; config: any }) => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Usuário não autenticado");
      const row = { ...payload, created_by: userId };
      const { data, error } = await supabase.from("mapa_cenarios").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mapa_cenarios"] });
      toast.success("Cenário salvo");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteCenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mapa_cenarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mapa_cenarios"] });
      toast.success("Cenário removido");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useMapaSetores(campanhaId?: string | null) {
  return useQuery({
    queryKey: ["mapa_setores", campanhaId ?? "global"],
    queryFn: async () => {
      let q = supabase.from("mapa_setores").select("*").order("created_at", { ascending: false });
      if (campanhaId) q = q.or(`campanha_id.eq.${campanhaId},campanha_id.is.null`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as MapaSetor[];
    },
  });
}

export function useSaveSetor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<MapaSetor> & { nome: string; geometria: any }) => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Usuário não autenticado");
      const row = { tipo: "setor", cor: "#3B82F6", ...payload, created_by: userId };
      const { data, error } = await supabase.from("mapa_setores").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mapa_setores"] });
      toast.success("Setor salvo");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateSetor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<MapaSetor> & { id: string }) => {
      const { data, error } = await supabase.from("mapa_setores").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mapa_setores"] });
      toast.success("Setor atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteSetor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mapa_setores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mapa_setores"] });
      toast.success("Setor removido");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// Cálculo simples de área (Shoelace em coordenadas geográficas - aproximação)
export function calcularAreaKm2(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const R = 6371; // raio da Terra
  let area = 0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  for (let i = 0; i < coords.length; i++) {
    const [lat1, lon1] = coords[i];
    const [lat2, lon2] = coords[(i + 1) % coords.length];
    area += toRad(lon2 - lon1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs((area * R * R) / 2);
}

export function calcularPerimetroKm(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  let total = 0;
  for (let i = 0; i < coords.length; i++) {
    const [lat1, lon1] = coords[i];
    const [lat2, lon2] = coords[(i + 1) % coords.length];
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
}
