import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EleitoralFilters = {
  uf: string;
  ano: number;
  cod_municipio_tse?: string;
  cargo?: string;
};

export function useTSEKpis(uf: string, ano: number) {
  return useQuery({
    queryKey: ["tse-kpis", uf, ano],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tse_dashboard_kpis", { _uf: uf, _ano: ano });
      if (error) throw error;
      return data as Record<string, number>;
    },
  });
}

export function useTSEMunicipioResumo(uf: string, ano: number) {
  return useQuery({
    queryKey: ["tse-mun-resumo", uf, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_tse_municipio_resumo" as any)
        .select("*")
        .eq("uf", uf)
        .eq("ano", ano)
        .order("total_eleitores", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useTSECandidatos(filters: EleitoralFilters & { busca?: string; eleito?: boolean; partido?: string }) {
  return useQuery({
    queryKey: ["tse-candidatos", filters],
    queryFn: async () => {
      let q = supabase
        .from("tse_candidatos")
        .select("id,ano,uf,cargo,cod_municipio_tse,partido_sigla,numero_urna,nome_urna,nome_completo,cpf,votos_recebidos,eleito,situacao_eleicao,genero,ocupacao,data_nascimento")
        .eq("uf", filters.uf)
        .eq("ano", filters.ano)
        .order("votos_recebidos", { ascending: false })
        .limit(500);
      if (filters.cargo) q = q.ilike("cargo", `%${filters.cargo}%`);
      if (filters.cod_municipio_tse) q = q.eq("cod_municipio_tse", filters.cod_municipio_tse);
      if (filters.partido) q = q.eq("partido_sigla", filters.partido);
      if (typeof filters.eleito === "boolean") q = q.eq("eleito", filters.eleito);
      if (filters.busca) q = q.or(`nome_completo.ilike.%${filters.busca}%,nome_urna.ilike.%${filters.busca}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useCandidatoHistorico(nomeCompleto: string | null, cpf: string | null) {
  return useQuery({
    queryKey: ["tse-cand-hist", nomeCompleto, cpf],
    enabled: !!nomeCompleto || !!cpf,
    queryFn: async () => {
      let q = supabase.from("v_tse_candidato_historico" as any).select("*");
      if (cpf) q = q.eq("cpf", cpf);
      else q = q.eq("nome_completo", nomeCompleto!);
      const { data, error } = await q.order("ano", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function usePessoaMatchTSE(pessoaId?: string) {
  return useQuery({
    queryKey: ["pessoa-match-tse", pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_pessoa_match_tse" as any)
        .select("*")
        .eq("pessoa_id", pessoaId)
        .order("ano", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useCandidatoMatchPessoa(nomeCompleto: string | null, cpf: string | null) {
  return useQuery({
    queryKey: ["cand-match-pessoa", nomeCompleto, cpf],
    enabled: !!nomeCompleto || !!cpf,
    queryFn: async () => {
      let q = supabase.from("v_pessoa_match_tse" as any).select("pessoa_id,pessoa_nome").limit(1);
      if (cpf) {
        // Match por nome (CPF nem sempre presente nos dados públicos TSE)
        q = q.eq("nome_completo", nomeCompleto!);
      } else {
        q = q.eq("nome_completo", nomeCompleto!);
      }
      const { data, error } = await q;
      if (error) throw error;
      return ((data ?? [])[0] as unknown) as { pessoa_id: string; pessoa_nome: string } | undefined;
    },
  });
}

export function useEleitoradoPerfil(uf: string, ano: number, municipio?: string) {
  return useQuery({
    queryKey: ["eleitorado-perfil-agg", uf, ano, municipio ?? null],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tse_eleitorado_agregado" as any, {
        _uf: uf,
        _ano: ano,
        _municipio: municipio ?? null,
      });
      if (error) throw error;
      return (data ?? { total: 0, genero: [], faixa_etaria: [], grau_instrucao: [], cor_raca: [], estado_civil: [] }) as {
        total: number;
        genero: { name: string; value: number }[];
        faixa_etaria: { name: string; value: number }[];
        grau_instrucao: { name: string; value: number }[];
        cor_raca: { name: string; value: number }[];
        estado_civil: { name: string; value: number }[];
      };
    },
  });
}

export function useVotosPorSecao(filters: { ano: number; uf: string; cod_municipio_tse: string; cargo?: string; numero_votavel?: string } | null) {
  return useQuery({
    queryKey: ["votos-secao", filters],
    enabled: !!filters?.cod_municipio_tse,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tse_votos_por_secao", {
        _ano: filters!.ano,
        _uf: filters!.uf,
        _cod_municipio_tse: filters!.cod_municipio_tse,
        _cargo: filters!.cargo ?? null,
        _numero_votavel: filters!.numero_votavel ?? null,
      });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useLocaisVotacao(uf: string, ano: number, cod_municipio_tse?: string) {
  return useQuery({
    queryKey: ["tse-locais", uf, ano, cod_municipio_tse],
    queryFn: async () => {
      let q = supabase
        .from("tse_locais_votacao")
        .select("id,zona,codigo_local,nome_local,endereco,bairro,cep,latitude,longitude,cod_municipio_tse")
        .eq("uf", uf)
        .eq("ano", ano)
        .limit(2000);
      if (cod_municipio_tse) q = q.eq("cod_municipio_tse", cod_municipio_tse);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useAnosDisponiveis(uf: string) {
  return useQuery({
    queryKey: ["tse-anos", uf],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tse_candidatos")
        .select("ano")
        .eq("uf", uf)
        .limit(5000);
      if (error) throw error;
      const anos = Array.from(new Set((data ?? []).map((r: any) => r.ano))).sort((a, b) => b - a);
      return anos.length ? anos : [2024, 2022, 2020, 2018];
    },
  });
}

export const CARGOS_TSE = [
  "Vereador", "Prefeito", "Vice-Prefeito",
  "Deputado Estadual", "Deputado Federal", "Senador",
  "Governador", "Vice-Governador", "Presidente",
];
