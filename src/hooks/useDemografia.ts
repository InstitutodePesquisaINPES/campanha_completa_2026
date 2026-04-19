import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Demografia = {
  id: string;
  municipio_id: string;
  ano: number;
  faixa_etaria: string;
  faixa_min: number;
  faixa_max: number | null;
  sexo: "M" | "F" | "T";
  quantidade: number;
  fonte: string;
};

export function useDemografiaMunicipio(municipioId?: string, ano = 2022) {
  return useQuery({
    queryKey: ["demografia", municipioId, ano],
    enabled: !!municipioId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("municipio_demografia")
        .select("*")
        .eq("municipio_id", municipioId)
        .eq("ano", ano)
        .order("faixa_min");
      if (error) throw error;
      return (data || []) as Demografia[];
    },
  });
}

export function useTopMunicipios(metric: "populacao_2022" | "densidade_hab_km2" | "idh" = "populacao_2022", limit = 10) {
  return useQuery({
    queryKey: ["top-municipios", metric, limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("municipios")
        .select("id, nome, populacao_2022, area_km2, idh, urbano_pct, densidade_hab_km2")
        .not(metric, "is", null)
        .order(metric, { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as Array<{
        id: string; nome: string;
        populacao_2022: number | null; area_km2: number | null;
        idh: number | null; urbano_pct: number | null; densidade_hab_km2: number | null;
      }>;
    },
  });
}

export function useImportJobs() {
  return useQuery({
    queryKey: ["import-jobs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("dados_externos_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as any[];
    },
    refetchInterval: 5000,
  });
}

export function useTriggerImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { fonte: "ibge" | "osm"; uf?: string; municipio_id?: string }) => {
      const fn = input.fonte === "ibge" ? "ibge-import-municipios-ba" : "osm-import-bairros-ba";
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { uf: input.uf || "BA", municipio_id: input.municipio_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["import-jobs"] });
      qc.invalidateQueries({ queryKey: ["municipios"] });
      qc.invalidateQueries({ queryKey: ["bairros"] });
      toast.success("Importação iniciada");
    },
    onError: (e: Error) => toast.error(`Falha: ${e.message}`),
  });
}
