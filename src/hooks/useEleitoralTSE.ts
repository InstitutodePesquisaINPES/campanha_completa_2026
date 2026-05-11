import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

const normalizarTexto = (value?: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .trim();

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
      const data = await api.get<Record<string, number>>(`/tse/kpis?uf=${uf}&ano=${ano}`);
      return data || {};
    },
    refetchInterval: 10000,
  });
}

export function useTSEMunicipioResumo(uf: string, ano: number) {
  return useQuery({
    queryKey: ["tse-mun-resumo", uf, ano],
    queryFn: async () => {
      const data = await api.get<any[]>(`/tse/municipios/resumo?uf=${uf}&ano=${ano}`);
      return data || [];
    },
    refetchInterval: 10000,
  });
}

export function useTSECandidatos(filters: EleitoralFilters & { busca?: string; eleito?: boolean; partido?: string }) {
  return useQuery({
    queryKey: ["tse-candidatos", filters],
    queryFn: async () => {
      const data = await api.post<any[]>("/tse/candidatos", filters);
      return data || [];
    },
    refetchInterval: 10000,
  });
}

export function useCandidatoHistorico(nomeCompleto: string | null, cpf: string | null) {
  return useQuery({
    queryKey: ["tse-cand-hist", nomeCompleto, cpf],
    enabled: !!nomeCompleto || !!cpf,
    queryFn: async () => {
      const url = cpf ? `/tse/candidato/historico?cpf=${cpf}` : `/tse/candidato/historico?nomeCompleto=${nomeCompleto}`;
      const data = await api.get<any[]>(url);
      return data || [];
    },
  });
}

export function usePessoaMatchTSE(pessoaId?: string) {
  return useQuery({
    queryKey: ["pessoa-match-tse", pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const data = await api.get<any[]>(`/tse/pessoa-match?pessoaId=${pessoaId}`);
      return data || [];
    },
  });
}

export function useCandidatoMatchPessoa(nomeCompleto: string | null, cpf: string | null) {
  return useQuery({
    queryKey: ["cand-match-pessoa", nomeCompleto, cpf],
    enabled: !!nomeCompleto || !!cpf,
    queryFn: async () => {
      const data = await api.post<any>("/tse/candidato-match", { nomeCompleto, cpf });
      return data;
    },
  });
}

export function useEleitoradoPerfil(uf: string, ano: number, municipio?: string) {
  return useQuery({
    queryKey: ["eleitorado-perfil-agg", uf, ano, municipio ?? null],
    queryFn: async () => {
      const data = await api.get<any>(`/tse/eleitorado/perfil?uf=${uf}&ano=${ano}${municipio ? `&municipio=${municipio}` : ''}`);
      return data || { total: 0, genero: [], faixa_etaria: [], grau_instrucao: [], cor_raca: [], estado_civil: [] };
    },
    refetchInterval: 10000,
  });
}

export function useVotosPorSecao(filters: { ano: number; uf: string; cod_municipio_tse: string; cargo?: string; numero_votavel?: string } | null) {
  return useQuery({
    queryKey: ["votos-secao", filters],
    enabled: !!filters?.cod_municipio_tse,
    queryFn: async () => {
      const data = await api.post<any[]>("/tse/votos/secao", filters);
      return data || [];
    },
    refetchInterval: 10000,
  });
}

export function useLocaisVotacao(uf: string, ano: number, cod_municipio_tse?: string) {
  return useQuery({
    queryKey: ["tse-locais", uf, ano, cod_municipio_tse],
    queryFn: async () => {
      const data = await api.get<any[]>(`/tse/locais-votacao?uf=${uf}&ano=${ano}${cod_municipio_tse ? `&cod_municipio_tse=${cod_municipio_tse}` : ''}`);
      return data || [];
    },
    refetchInterval: 10000,
  });
}

export function useAnosDisponiveis(uf: string) {
  return useQuery({
    queryKey: ["tse-anos", uf],
    queryFn: async () => {
      const data = await api.get<number[]>(`/tse/anos-disponiveis?uf=${uf}`);
      return data || [2024, 2022, 2020, 2018];
    },
  });
}

export function useTSEComparativo(uf: string, municipio?: string, cargo?: string) {
  return useQuery({
    queryKey: ["tse-comparativo", uf, municipio ?? null, cargo ?? null],
    queryFn: async () => {
      const data = await api.get<any[]>(`/tse/comparativo?uf=${uf}${municipio ? `&municipio=${municipio}` : ''}${cargo ? `&cargo=${cargo}` : ''}`);
      return data || [];
    },
    refetchInterval: 10000,
  });
}

export function useTSEOrigemVotosLocal(filters: { ano: number; uf: string; cod_municipio_tse: string; cargo?: string; numero_votavel?: string } | null) {
  return useQuery({
    queryKey: ["tse-origem-local", filters],
    enabled: !!filters?.cod_municipio_tse,
    queryFn: async () => {
      const data = await api.post<any[]>("/tse/origem-votos-local", filters);
      return data || [];
    },
    refetchInterval: 10000,
  });
}

export function useEleitoralSecaoPerfil(uf: string, ano: number, codMunicipioTse?: string, zona?: number, secao?: number) {
  return useQuery({
    queryKey: ["tse-eleitorado-secao", uf, ano, codMunicipioTse, zona, secao],
    enabled: !!(uf && ano && codMunicipioTse && zona && secao),
    queryFn: async () => {
      const data = await api.get<any>(
        `/tse/eleitorado/secao/perfil?uf=${uf}&ano=${ano}&cod_municipio_tse=${codMunicipioTse}&zona=${zona}&secao=${secao}`
      );
      return data || null;
    },
  });
}

export function useQuocienteEleitoral(uf: string, ano: number, codMunicipioTse?: string, cargo?: string) {
  return useQuery({
    queryKey: ["tse-quociente", uf, ano, codMunicipioTse, cargo],
    enabled: !!(uf && ano && codMunicipioTse && cargo),
    queryFn: async () => {
      const data = await api.get<any>(
        `/tse/quociente-eleitoral?uf=${uf}&ano=${ano}&cod_municipio_tse=${codMunicipioTse}&cargo=${cargo}`
      );
      return data || null;
    },
  });
}

export const CARGOS_TSE = [
  "Vereador", "Prefeito", "Vice-Prefeito",
  "Deputado Estadual", "Deputado Federal", "Senador",
  "Governador", "Vice-Governador", "Presidente",
];
