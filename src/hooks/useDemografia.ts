import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
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
      const data = await api.get<Demografia[]>(`/territorio/demografia?municipioId=${municipioId}&ano=${ano}`);
      return data || [];
    },
  });
}

export function useTopMunicipios(metric: "populacao_2022" | "densidade_hab_km2" | "idh" = "populacao_2022", limit = 10) {
  return useQuery({
    queryKey: ["top-municipios", metric, limit],
    queryFn: async () => {
      const data = await api.get<any[]>(`/territorio/municipios/top?metric=${metric}&limit=${limit}`);
      return data || [];
    },
  });
}

export function useImportJobs() {
  return useQuery({
    queryKey: ["import-jobs"],
    queryFn: async () => {
      const data = await api.get<any[]>("/territorio/import-jobs");
      return data || [];
    },
    refetchInterval: 5000,
  });
}

export function useTriggerImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { fonte: "ibge" | "osm"; uf?: string; municipio_id?: string }) => {
      const data = await api.post<any>("/territorio/importar", {
        fonte: input.fonte,
        uf: input.uf || "BA",
        municipio_id: input.municipio_id,
      });
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["import-jobs"] });
      qc.invalidateQueries({ queryKey: ["municipios"] });
      qc.invalidateQueries({ queryKey: ["bairros"] });
      toast.success(data?.mensagem || (data?.ja_concluido ? "Importação já estava completa" : "Importação iniciada"));
    },
    onError: (e: Error) => toast.error(`Falha: ${e.message}`),
  });
}
