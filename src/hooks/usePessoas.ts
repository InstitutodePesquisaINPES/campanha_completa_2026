import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

export type PessoaInput = {
  fullName?: string;
  full_name?: string;
  tipoPessoa?: string;
  tipo_pessoa?: string;
  cpf?: string;
  cnpj?: string;
  razaoSocial?: string;
  razao_social?: string;
  nomeFantasia?: string;
  nome_fantasia?: string;
  dataNascimento?: string;
  data_nascimento?: string;
  genero?: string;
  escolaridade?: string;
  nivelRelacionamento?: string;
  nivel_relacionamento?: string;
  observacoes?: string;
  [key: string]: unknown;
};

function normalizePessoa(raw: any) {
  if (!raw) return raw;
  return {
    ...raw,
    full_name: raw.full_name ?? raw.fullName,
    tipo_pessoa: raw.tipo_pessoa ?? raw.tipoPessoa,
    razao_social: raw.razao_social ?? raw.razaoSocial,
    nome_fantasia: raw.nome_fantasia ?? raw.nomeFantasia,
    data_nascimento: raw.data_nascimento ?? raw.dataNascimento,
    nivel_relacionamento: raw.nivel_relacionamento ?? raw.nivelRelacionamento,
    is_lideranca: raw.is_lideranca ?? raw.isLideranca,
    lideranca_id: raw.lideranca_id ?? raw.liderancaId,
  };
}

function pessoaPayload(values: Partial<PessoaInput>) {
  return {
    fullName: values.fullName ?? values.full_name,
    tipoPessoa: values.tipoPessoa ?? values.tipo_pessoa,
    cpf: values.cpf,
    cnpj: values.cnpj,
    razaoSocial: values.razaoSocial ?? values.razao_social,
    nomeFantasia: values.nomeFantasia ?? values.nome_fantasia,
    dataNascimento: values.dataNascimento ?? values.data_nascimento,
    genero: values.genero,
    escolaridade: values.escolaridade,
    nivelRelacionamento:
      values.nivelRelacionamento ?? values.nivel_relacionamento,
    observacoes: values.observacoes,
  };
}

// ---- PESSOAS ----
export function usePessoas(search?: string, nivel?: string, tipo?: string) {
  return useQuery({
    queryKey: ["pessoas", search, nivel, tipo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (nivel && nivel !== "all") params.append("nivel", nivel);
      if (tipo && tipo !== "all") params.append("tipo", tipo);
      
      const queryStr = params.toString();
      const data = await api.get<any[]>(`/pessoas${queryStr ? `?${queryStr}` : ''}`);
      return (data || []).map(normalizePessoa);
    },
  });
}

export function usePessoa(id?: string) {
  return useQuery({
    queryKey: ["pessoa", id],
    queryFn: async () => {
      if (!id) return null;
      return normalizePessoa(await api.get<any>(`/pessoas/${id}`));
    },
    enabled: !!id,
  });
}

export function useCreatePessoa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: PessoaInput) => {
      return normalizePessoa(await api.post<any>("/pessoas", pessoaPayload(values)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pessoas"] }),
  });
}

export function useUpdatePessoa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Partial<PessoaInput>) => {
      return normalizePessoa(await api.patch<any>(`/pessoas/${id}`, pessoaPayload(values)));
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["pessoas"] });
      qc.invalidateQueries({ queryKey: ["pessoa", vars.id] });
    },
  });
}

export function useDeletePessoa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<void>(`/pessoas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pessoas"] }),
  });
}

// ---- CONTATOS ----
export function useContatos(pessoaId?: string) {
  return useQuery({
    queryKey: ["pessoas_contatos", pessoaId],
    queryFn: async () => {
      return api.get<any[]>(`/pessoas/${pessoaId}/contatos`);
    },
    enabled: !!pessoaId,
  });
}

export function useCreateContato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { pessoaId?: string; pessoa_id?: string; tipo: string; valor: string; principal?: boolean }) => {
      const pessoaId = values.pessoaId || values.pessoa_id;
      const { pessoaId: _pessoaId, pessoa_id: _pessoa_id, ...data } = values;
      return api.post<any>(`/pessoas/${pessoaId}/contatos`, data);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["pessoas_contatos", v.pessoaId || v.pessoa_id] }),
  });
}

export function useDeleteContato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pessoaId }: { id: string; pessoaId: string }) => {
      await api.delete<void>(`/pessoas/contatos/${id}`);
      return pessoaId;
    },
    onSuccess: (pessoaId) => qc.invalidateQueries({ queryKey: ["pessoas_contatos", pessoaId] }),
  });
}

// ---- ENDEREÇOS ----
export function useEnderecos(pessoaId?: string) {
  return useQuery({
    queryKey: ["pessoas_enderecos", pessoaId],
    queryFn: async () => {
      return api.get<any[]>(`/pessoas/${pessoaId}/enderecos`);
    },
    enabled: !!pessoaId,
  });
}

export function useCreateEndereco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { pessoaId?: string; pessoa_id?: string; logradouro?: string; numero?: string; complemento?: string; bairroId?: string; bairro_id?: string; municipioId?: string; municipio_id?: string; cep?: string; tipo?: string }) => {
      const pessoaId = values.pessoaId || values.pessoa_id;
      const { pessoaId: _pessoaId, pessoa_id: _pessoa_id, bairro_id, municipio_id, ...rest } = values;
      const data = {
        ...rest,
        bairroId: values.bairroId || bairro_id,
        municipioId: values.municipioId || municipio_id,
      };
      return api.post<any>(`/pessoas/${pessoaId}/enderecos`, data);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["pessoas_enderecos", v.pessoaId || v.pessoa_id] }),
  });
}

export function useDeleteEndereco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pessoaId }: { id: string; pessoaId: string }) => {
      await api.delete<void>(`/pessoas/enderecos/${id}`);
      return pessoaId;
    },
    onSuccess: (pessoaId) => qc.invalidateQueries({ queryKey: ["pessoas_enderecos", pessoaId] }),
  });
}

// ---- PAPÉIS ----
export function usePapeis(pessoaId?: string) {
  return useQuery({
    queryKey: ["pessoas_papeis", pessoaId],
    queryFn: async () => {
      return api.get<any[]>(`/pessoas/${pessoaId}/papeis`);
    },
    enabled: !!pessoaId,
  });
}

export function useCreatePapel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { pessoaId?: string; pessoa_id?: string; papel: string; ativo?: boolean }) => {
      const pessoaId = values.pessoaId || values.pessoa_id;
      const { pessoaId: _pessoaId, pessoa_id: _pessoa_id, ...data } = values;
      return api.post<any>(`/pessoas/${pessoaId}/papeis`, data);
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["pessoas_papeis", v.pessoaId || v.pessoa_id] }),
  });
}

export function useDeletePapel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pessoaId }: { id: string; pessoaId: string }) => {
      await api.delete<void>(`/pessoas/papeis/${id}`);
      return pessoaId;
    },
    onSuccess: (pessoaId) => qc.invalidateQueries({ queryKey: ["pessoas_papeis", pessoaId] }),
  });
}

// ---- TAGS ----
export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      return api.get<any[]>('/pessoas/tags');
    },
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nome: string; cor?: string; categoria?: string }) => {
      return api.post<any>('/pessoas/tags', values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useAddPessoaTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pessoaId, tagId }: { pessoaId: string; tagId: string }) => {
      return api.post<void>(`/pessoas/${pessoaId}/tags/${tagId}`, {});
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pessoas"] }),
  });
}

export function useRemovePessoaTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pessoaId, tagId }: { pessoaId: string; tagId: string }) => {
      return api.delete<void>(`/pessoas/${pessoaId}/tags/${tagId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pessoas"] }),
  });
}

export function useHistorico(pessoaId?: string) {
  return useQuery({
    queryKey: ["pessoas_historico", pessoaId],
    queryFn: async () => api.get<any[]>(`/pessoas/${pessoaId}/historico`),
    enabled: !!pessoaId,
  });
}

export function useCreateHistorico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const pessoaId = values.pessoaId || values.pessoa_id;
      const { pessoaId: _pessoaId, pessoa_id: _pessoa_id, ...data } = values;
      return api.post<any>(`/pessoas/${pessoaId}/historico`, data);
    },
    onSuccess: (_, v: any) =>
      qc.invalidateQueries({ queryKey: ["pessoas_historico", v.pessoaId || v.pessoa_id] }),
  });
}

export function useConsentimentos(pessoaId?: string) {
  return useQuery({
    queryKey: ["pessoas_consentimentos", pessoaId],
    queryFn: async () => api.get<any[]>(`/pessoas/${pessoaId}/consentimentos`),
    enabled: !!pessoaId,
  });
}

export function useCreateConsentimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const pessoaId = values.pessoaId || values.pessoa_id;
      const { pessoaId: _pessoaId, pessoa_id: _pessoa_id, ...data } = values;
      return api.post<any>(`/pessoas/${pessoaId}/consentimentos`, data);
    },
    onSuccess: (_, v: any) =>
      qc.invalidateQueries({ queryKey: ["pessoas_consentimentos", v.pessoaId || v.pessoa_id] }),
  });
}
