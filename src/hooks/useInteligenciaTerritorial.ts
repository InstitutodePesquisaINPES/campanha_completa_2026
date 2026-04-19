import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LacunaTerritorial = {
  bairro_id: string;
  bairro_nome: string;
  municipio_id: string;
  municipio_nome: string;
  classificacao: string | null;
  latitude: number | null;
  longitude: number | null;
  total_pessoas: number;
  total_eventos: number;
  demandas_abertas: number;
  score_prioridade: number;
};

export function useLacunasTerritoriais() {
  return useQuery({
    queryKey: ["lacunas-territoriais"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_lacunas_territoriais")
        .select("*")
        .order("score_prioridade", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as LacunaTerritorial[];
    },
  });
}
