import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SituacaoBairro = "forte" | "medio" | "fraco" | "critico";

export interface BairroEstrategico {
  bairro_id: string;
  bairro_nome: string;
  classificacao: string | null;
  municipio_id: string;
  municipio_nome: string;
  eleitores_cadastrados: number;
  apoiadores: number;
  meta_votos_total: number;
  demandas_abertas: number;
  demandas_resolvidas: number;
  cobertura_pct: number;
  situacao: SituacaoBairro;
  prioridade: "manter" | "expandir" | "atencao" | "urgente";
  acao_recomendada: string;
}

function classificar(b: {
  apoiadores: number;
  eleitores_cadastrados: number;
  demandas_abertas: number;
  demandas_resolvidas: number;
  meta_votos_total: number;
}): Pick<BairroEstrategico, "cobertura_pct" | "situacao" | "prioridade" | "acao_recomendada"> {
  const totalDem = b.demandas_abertas + b.demandas_resolvidas;
  const cobertura_pct = totalDem > 0 ? b.demandas_resolvidas / totalDem : 0;

  let situacao: SituacaoBairro = "fraco";
  if (b.apoiadores >= 5 && cobertura_pct >= 0.7) situacao = "forte";
  else if (b.apoiadores >= 3 || cobertura_pct >= 0.5) situacao = "medio";
  else if (b.apoiadores === 0 && b.eleitores_cadastrados === 0) situacao = "critico";

  let prioridade: BairroEstrategico["prioridade"] = "atencao";
  let acao_recomendada = "Iniciar mapeamento e visitas";
  if (situacao === "forte") {
    prioridade = "manter";
    acao_recomendada = "Manter presença e resolver demandas pendentes";
  } else if (situacao === "medio") {
    prioridade = "expandir";
    acao_recomendada = "Aumentar visitas e recrutar lideranças";
  } else if (situacao === "fraco") {
    prioridade = "atencao";
    acao_recomendada = "Plano de ataque: porta-a-porta e evento local";
  } else {
    prioridade = "urgente";
    acao_recomendada = "Iniciar mapeamento urgente do bairro";
  }
  return { cobertura_pct, situacao, prioridade, acao_recomendada };
}

export function useMapaEstrategico(municipioId?: string) {
  return useQuery({
    queryKey: ["mapa-estrategico", municipioId],
    queryFn: async () => {
      let q = supabase.from("mapa_estrategico_bairros" as never).select("*");
      if (municipioId) q = q.eq("municipio_id", municipioId);
      const { data, error } = await q;
      if (error) throw error;
      return ((data ?? []) as Array<Omit<BairroEstrategico, "cobertura_pct" | "situacao" | "prioridade" | "acao_recomendada">>).map((b) => ({
        ...b,
        ...classificar(b),
      })) as BairroEstrategico[];
    },
  });
}
