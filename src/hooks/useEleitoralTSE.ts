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
      if ((data ?? []).length > 0) return data as any[];

      // Fallback: agrega a partir de tse_votacao_candidato_perfil (CSVs do TSE de votação)
      let q2 = supabase
        .from("tse_votacao_candidato_perfil")
        .select("ano,uf,municipio,cod_municipio_tse,cargo,nome_candidato,numero_candidato,partido,situacao_totalizacao,genero,ocupacao,votos_nominais")
        .eq("uf", filters.uf)
        .eq("ano", filters.ano)
        .limit(50000);
      if (filters.cargo) q2 = q2.ilike("cargo", `%${filters.cargo}%`);
      if (filters.cod_municipio_tse) q2 = q2.eq("cod_municipio_tse", filters.cod_municipio_tse);
      if (filters.partido) q2 = q2.eq("partido", filters.partido);
      if (filters.busca) q2 = q2.ilike("nome_candidato", `%${filters.busca}%`);
      const { data: rows2, error: e2 } = await q2;
      if (e2) throw e2;
      const agg = new Map<string, any>();
      for (const r of (rows2 ?? []) as any[]) {
        const key = `${r.ano}|${r.uf}|${r.cod_municipio_tse}|${r.cargo}|${r.numero_candidato}`;
        const cur = agg.get(key);
        if (cur) {
          cur.votos_recebidos += Number(r.votos_nominais ?? 0);
        } else {
          const eleito = /eleito/i.test(r.situacao_totalizacao ?? "") && !/n[aã]o/i.test(r.situacao_totalizacao ?? "");
          agg.set(key, {
            id: key,
            ano: r.ano,
            uf: r.uf,
            cargo: r.cargo,
            cod_municipio_tse: r.cod_municipio_tse,
            partido_sigla: r.partido,
            numero_urna: r.numero_candidato,
            nome_urna: r.nome_candidato,
            nome_completo: r.nome_candidato,
            cpf: null,
            votos_recebidos: Number(r.votos_nominais ?? 0),
            eleito,
            situacao_eleicao: r.situacao_totalizacao,
            genero: r.genero,
            ocupacao: r.ocupacao,
            data_nascimento: null,
          });
        }
      }
      const list = Array.from(agg.values()).sort((a, b) => b.votos_recebidos - a.votos_recebidos);
      if (typeof filters.eleito === "boolean") return list.filter((c) => c.eleito === filters.eleito);
      return list;
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

      if ((data ?? []).length > 0) {
        return (data ?? []) as any[];
      }

      if (!nomeCompleto) {
        return [] as any[];
      }

      const { data: rows, error: fallbackError } = await supabase
        .from("tse_votacao_candidato_perfil")
        .select("ano,uf,municipio,cod_municipio_tse,cargo,nome_candidato,numero_candidato,partido,situacao_totalizacao,genero,ocupacao,votos_nominais")
        .ilike("nome_candidato", nomeCompleto)
        .limit(50000);

      if (fallbackError) throw fallbackError;

      const agg = new Map<string, any>();
      for (const r of (rows ?? []) as any[]) {
        const key = `${r.ano}|${r.uf}|${r.cod_municipio_tse}|${r.cargo}|${r.numero_candidato}`;
        const cur = agg.get(key);
        if (cur) {
          cur.votos_recebidos += Number(r.votos_nominais ?? 0);
          continue;
        }

        agg.set(key, {
          id: key,
          ano: r.ano,
          uf: r.uf,
          cargo: r.cargo,
          cod_municipio_tse: r.cod_municipio_tse,
          cpf: null,
          data_nascimento: null,
          eleito: /eleito/i.test(r.situacao_totalizacao ?? "") && !/n[aã]o/i.test(r.situacao_totalizacao ?? ""),
          genero: r.genero,
          municipio_id: null,
          municipio_nome: r.municipio,
          nome_completo: r.nome_candidato,
          nome_urna: r.nome_candidato,
          numero_urna: r.numero_candidato,
          ocupacao: r.ocupacao,
          partido_sigla: r.partido,
          situacao_eleicao: r.situacao_totalizacao,
          votos_recebidos: Number(r.votos_nominais ?? 0),
        });
      }

      return Array.from(agg.values()).sort((a, b) => (b.ano ?? 0) - (a.ano ?? 0));
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
      const [a, b, c] = await Promise.all([
        supabase.from("tse_candidatos").select("ano").eq("uf", uf).limit(5000),
        supabase.from("tse_votacao_candidato_perfil").select("ano").eq("uf", uf).limit(5000),
        supabase.from("tse_eleitorado_perfil").select("ano").eq("uf", uf).limit(5000),
      ]);
      const set = new Set<number>();
      for (const r of (a.data ?? []) as any[]) set.add(r.ano);
      for (const r of (b.data ?? []) as any[]) set.add(r.ano);
      for (const r of (c.data ?? []) as any[]) set.add(r.ano);
      const anos = Array.from(set).sort((x, y) => y - x);
      return anos.length ? anos : [2024, 2022, 2020, 2018];
    },
  });
}

export function useTSEComparativo(uf: string, municipio?: string, cargo?: string) {
  return useQuery({
    queryKey: ["tse-comparativo", uf, municipio ?? null, cargo ?? null],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tse_comparativo_eleicoes" as any, {
        _uf: uf, _municipio: municipio ?? null, _cargo: cargo ?? null,
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        ano: number; total_eleitores: number; total_candidatos: number; total_eleitos: number; total_votos_nominais: number;
      }>;
    },
  });
}

export function useTSEOrigemVotosLocal(filters: { ano: number; uf: string; cod_municipio_tse: string; cargo?: string; numero_votavel?: string } | null) {
  return useQuery({
    queryKey: ["tse-origem-local", filters],
    enabled: !!filters?.cod_municipio_tse,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tse_origem_votos_local" as any, {
        _ano: filters!.ano, _uf: filters!.uf, _cod_municipio_tse: filters!.cod_municipio_tse,
        _cargo: filters!.cargo ?? null, _numero_votavel: filters!.numero_votavel ?? null,
      });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export const CARGOS_TSE = [
  "Vereador", "Prefeito", "Vice-Prefeito",
  "Deputado Estadual", "Deputado Federal", "Senador",
  "Governador", "Vice-Governador", "Presidente",
];
