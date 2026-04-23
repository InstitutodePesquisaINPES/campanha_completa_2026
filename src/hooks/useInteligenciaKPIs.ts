import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook agregador de KPIs cruzados da Inteligência.
 * Consolida dados de: municípios estratégicos, lideranças, vereadores,
 * bairros estratégicos e demandas territoriais.
 */
export function useInteligenciaKPIs(campanhaId?: string, uf = "BA", ano = 2024) {
  return useQuery({
    queryKey: ["inteligencia-kpis", campanhaId, uf, ano],
    enabled: !!campanhaId,
    queryFn: async () => {
      const [muns, lids, vers, bairros, demandas] = await Promise.all([
        supabase.from("municipios_estrategicos")
          .select("classificacao, meta_votos, votos_historicos")
          .eq("campanha_id", campanhaId!),
        supabase.from("liderancas_locais")
          .select("classificacao, status, votos_estimados, pessoa_id")
          .eq("campanha_id", campanhaId!),
        supabase.from("vereadores_historicos")
          .select("alinhamento, eleito, votos_recebidos")
          .eq("uf", uf).eq("ano", ano),
        supabase.from("bairros_estrategicos")
          .select("score, meta_votos")
          .eq("campanha_id", campanhaId!),
        supabase.from("demandas")
          .select("id, status, bairro_id")
          .in("status", ["aberta", "em_andamento", "triagem", "encaminhada"])
          .limit(1000),
      ]);

      const m = muns.data ?? [];
      const l = lids.data ?? [];
      const v = vers.data ?? [];
      const b = bairros.data ?? [];
      const d = demandas.data ?? [];

      const metaVotos = m.reduce((a: number, x: any) => a + (x.meta_votos ?? 0), 0);
      const votosHist = m.reduce((a: number, x: any) => a + (x.votos_historicos ?? 0), 0);
      const votosLid = l.reduce((a: number, x: any) => a + (x.votos_estimados ?? 0), 0);
      const lidAB = l.filter((x: any) => x.classificacao === "A" || x.classificacao === "B").length;
      const lidConvertidas = l.filter((x: any) => !!x.pessoa_id).length;
      const aliados = v.filter((x: any) => x.alinhamento === "aliado").length;
      const adversarios = v.filter((x: any) => x.alinhamento === "adversario").length;
      const redutos = m.filter((x: any) => x.classificacao === "reduto").length;
      const expansao = m.filter((x: any) => x.classificacao === "expansao").length;
      const bairrosCriticos = b.filter((x: any) => Number(x.score) < 30).length;

      // cobertura: % da meta que já temos com votos hist + rede de lideranças
      const coberturaPct = metaVotos > 0
        ? Math.min(100, Math.round(((votosHist + votosLid) / metaVotos) * 100))
        : 0;

      return {
        municipios: { total: m.length, redutos, expansao, metaVotos, votosHist },
        liderancas: { total: l.length, classeAB: lidAB, votos: votosLid, convertidasCRM: lidConvertidas },
        vereadores: { total: v.length, aliados, adversarios },
        bairros: { total: b.length, criticos: bairrosCriticos },
        demandas: { abertas: d.length },
        coberturaPct,
      };
    },
  });
}
