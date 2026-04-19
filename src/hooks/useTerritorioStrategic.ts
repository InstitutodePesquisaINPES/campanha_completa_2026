// Visão estratégica de territórios — agrega dados cruzados (eleitorado, bairros, pessoas, classificação)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// IDs IBGE da microrregião de Vitória da Conquista (32 municípios) usados como "foco padrão" do Kiribamba
export const MICRORREGIAO_VC_IBGE = [
  "2933307", // Vitória da Conquista
  "2900801", // Anagé
  "2901502", // Aracatu
  "2904605", // Barra do Choça
  "2905107", // Belo Campo
  "2906857", // Boa Nova
  "2908804", // Cândido Sales
  "2909307", // Caraíbas
  "2909802", // Caetanos
  "2910008", // Caatiba
  "2911105", // Condeúba
  "2911501", // Cordeiros
  "2913606", // Encruzilhada
  "2918803", // Guajeru
  "2918902", // Iguaí
  "2919306", // Ibicuí
  "2920009", // Itambé
  "2921906", // Itapetinga
  "2922151", // Itarantim
  "2922706", // Itororó
  "2924108", // Jussiape (placeholder, ajustar se necessário)
  "2925006", // Licínio de Almeida
  "2925501", // Macarani
  "2925709", // Maetinga
  "2926707", // Maiquinique
  "2929206", // Mortugaba
  "2930105", // Nova Canaã
  "2932101", // Piripá
  "2932457", // Planalto
  "2932903", // Poções
  "2933208", // Presidente Jânio Quadros
  "2933455", // Ribeirão do Largo
  "2933604", // Tremedal
];

export type StrategicMunicipio = {
  id: string;
  nome: string;
  estado_sigla: string;
  geocodigo_ibge: string | null;
  populacao: number | null;
  eleitorado_total: number | null;
  latitude: number | null;
  longitude: number | null;
  classificacao_estrategica: "A" | "B" | "C" | "foco" | null;
  prioridade_campanha: number | null;
  notas_estrategicas: string | null;
  bairros_count: number;
  pessoas_count: number;
  is_foco: boolean; // está nos municipios_foco_ids da campanha ativa OU é da microrregião de VC
};

export function useStrategicMunicipios() {
  return useQuery({
    queryKey: ["strategic-municipios"],
    queryFn: async (): Promise<StrategicMunicipio[]> => {
      // 1. busca municípios da BA
      const [{ data: estados }] = await Promise.all([
        supabase.from("estados").select("id, sigla").eq("sigla", "BA"),
      ]);
      const estadoBaId = estados?.[0]?.id;
      const { data: municipios } = await supabase
        .from("municipios")
        .select("*, estados(sigla)")
        .eq("estado_id", estadoBaId || "")
        .order("nome");
      if (!municipios) return [];

      // 2. busca foco da campanha ativa
      const { data: campanhaAtiva } = await supabase
        .from("campanhas")
        .select("municipios_foco_ids")
        .eq("ativa", true)
        .limit(1)
        .maybeSingle();
      const focoIds = new Set(campanhaAtiva?.municipios_foco_ids || []);

      // 3. contagem de bairros por município
      const { data: bairrosAgg } = await supabase
        .from("bairros")
        .select("municipio_id");
      const bairrosCount = new Map<string, number>();
      (bairrosAgg || []).forEach((b: any) => {
        bairrosCount.set(b.municipio_id, (bairrosCount.get(b.municipio_id) || 0) + 1);
      });

      // 4. contagem de pessoas por município (via endereços)
      const { data: pessoasAgg } = await supabase
        .from("pessoas_enderecos")
        .select("municipio_id, pessoa_id");
      const pessoasCount = new Map<string, Set<string>>();
      (pessoasAgg || []).forEach((p: any) => {
        if (!p.municipio_id) return;
        if (!pessoasCount.has(p.municipio_id)) pessoasCount.set(p.municipio_id, new Set());
        pessoasCount.get(p.municipio_id)!.add(p.pessoa_id);
      });

      return municipios.map((m: any) => {
        const isFocoCampanha = focoIds.has(m.id);
        const isMicrorregiaoVC = m.geocodigo_ibge && MICRORREGIAO_VC_IBGE.includes(m.geocodigo_ibge);
        return {
          id: m.id,
          nome: m.nome,
          estado_sigla: m.estados?.sigla || "BA",
          geocodigo_ibge: m.geocodigo_ibge,
          populacao: m.populacao,
          eleitorado_total: m.eleitorado_total,
          latitude: m.latitude,
          longitude: m.longitude,
          classificacao_estrategica: m.classificacao_estrategica,
          prioridade_campanha: m.prioridade_campanha,
          notas_estrategicas: m.notas_estrategicas,
          bairros_count: bairrosCount.get(m.id) || 0,
          pessoas_count: pessoasCount.get(m.id)?.size || 0,
          is_foco: isFocoCampanha || isMicrorregiaoVC,
        };
      });
    },
  });
}

export function useUpdateMunicipioStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: {
      id: string;
      classificacao_estrategica?: "A" | "B" | "C" | "foco" | null;
      prioridade_campanha?: number | null;
      notas_estrategicas?: string | null;
    }) => {
      const { id, ...patch } = vals;
      const { error } = await supabase.from("municipios").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategic-municipios"] });
      qc.invalidateQueries({ queryKey: ["municipios"] });
    },
  });
}
