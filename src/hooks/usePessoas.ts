import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type NivelRelacionamento = "desconhecido" | "frio" | "morno" | "quente" | "aliado" | "lideranca";
type TipoPessoa = "pf" | "pj";
type PorteEmpresa = "mei" | "me" | "epp" | "medio" | "grande";
type TipoContato = "celular" | "fixo" | "whatsapp" | "email" | "instagram" | "facebook" | "twitter";

export type PessoaInput = {
  full_name: string;
  tipo_pessoa?: TipoPessoa;
  cpf?: string;
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  porte?: PorteEmpresa;
  segmento?: string;
  site?: string;
  data_fundacao?: string;
  responsavel_legal?: string;
  data_nascimento?: string;
  genero?: string;
  escolaridade?: string;
  nivel_relacionamento?: NivelRelacionamento;
  observacoes?: string;
};
type TipoEndereco = "residencial" | "comercial" | "referencia";
type PapelPessoa = "eleitor" | "apoiador" | "lideranca" | "coordenador_bairro" | "doador" | "fornecedor" | "imprensa" | "institucional" | "demandante" | "equipe";
type TipoVinculo = "familiar" | "comunitario" | "profissional" | "politico" | "indicacao";
type TipoInteracao = "ligacao" | "visita" | "whatsapp" | "email" | "reuniao" | "evento";
type FinalidadeLgpd = "comunicacao_politica" | "pesquisa" | "campanha" | "mandato";

// ---- PESSOAS ----
export function usePessoas(search?: string, nivel?: string, tipo?: string) {
  return useQuery({
    queryKey: ["pessoas", search, nivel, tipo],
    queryFn: async () => {
      let q = supabase.from("pessoas").select("*, pessoas_papeis(papel, ativo), pessoas_contatos(tipo, valor, principal), pessoas_tags(tag_id, tags(nome, cor))").order("full_name").limit(500);
      if (search) {
        const s = `%${search}%`;
        q = q.or(`full_name.ilike.${s},razao_social.ilike.${s},nome_fantasia.ilike.${s},cpf.ilike.${s},cnpj.ilike.${s}`);
      }
      if (nivel && nivel !== "all") q = q.eq("nivel_relacionamento", nivel as NivelRelacionamento);
      if (tipo && tipo !== "all") q = q.eq("tipo_pessoa", tipo as TipoPessoa);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePessoa(id?: string) {
  return useQuery({
    queryKey: ["pessoa", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("pessoas")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePessoa() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: PessoaInput) => {
      const { data, error } = await supabase.from("pessoas").insert({ ...values, created_by: user?.id } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pessoas"] }),
  });
}

export function useUpdatePessoa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Partial<PessoaInput>) => {
      const { data, error } = await supabase.from("pessoas").update(values as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
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
      const { error } = await supabase.from("pessoas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pessoas"] }),
  });
}

// ---- CONTATOS ----
export function useContatos(pessoaId?: string) {
  return useQuery({
    queryKey: ["pessoas_contatos", pessoaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("pessoas_contatos").select("*").eq("pessoa_id", pessoaId!).order("principal", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!pessoaId,
  });
}

export function useCreateContato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { pessoa_id: string; tipo: TipoContato; valor: string; principal?: boolean }) => {
      const { data, error } = await supabase.from("pessoas_contatos").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["pessoas_contatos", v.pessoa_id] }),
  });
}

export function useDeleteContato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pessoaId }: { id: string; pessoaId: string }) => {
      const { error } = await supabase.from("pessoas_contatos").delete().eq("id", id);
      if (error) throw error;
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
      const { data, error } = await supabase.from("pessoas_enderecos").select("*, bairros(nome), municipios(nome)").eq("pessoa_id", pessoaId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!pessoaId,
  });
}

export function useCreateEndereco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { pessoa_id: string; logradouro?: string; numero?: string; complemento?: string; bairro_id?: string; municipio_id?: string; cep?: string; tipo?: TipoEndereco }) => {
      const { data, error } = await supabase.from("pessoas_enderecos").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["pessoas_enderecos", v.pessoa_id] }),
  });
}

export function useDeleteEndereco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pessoaId }: { id: string; pessoaId: string }) => {
      const { error } = await supabase.from("pessoas_enderecos").delete().eq("id", id);
      if (error) throw error;
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
      const { data, error } = await supabase.from("pessoas_papeis").select("*").eq("pessoa_id", pessoaId!).order("ativo", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!pessoaId,
  });
}

export function useCreatePapel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { pessoa_id: string; papel: PapelPessoa; ativo?: boolean }) => {
      const { data, error } = await supabase.from("pessoas_papeis").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["pessoas_papeis", v.pessoa_id] }),
  });
}

export function useDeletePapel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pessoaId }: { id: string; pessoaId: string }) => {
      const { error } = await supabase.from("pessoas_papeis").delete().eq("id", id);
      if (error) throw error;
      return pessoaId;
    },
    onSuccess: (pessoaId) => qc.invalidateQueries({ queryKey: ["pessoas_papeis", pessoaId] }),
  });
}

// ---- HISTÓRICO ----
export function useHistorico(pessoaId?: string) {
  return useQuery({
    queryKey: ["pessoas_historico", pessoaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("pessoas_historico_contatos").select("*").eq("pessoa_id", pessoaId!).order("data_contato", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!pessoaId,
  });
}

export function useCreateHistorico() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { pessoa_id: string; tipo: TipoInteracao; resumo?: string; resultado?: string; proximo_contato?: string }) => {
      const { data, error } = await supabase.from("pessoas_historico_contatos").insert({ ...values, responsavel_id: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["pessoas_historico", v.pessoa_id] }),
  });
}

// ---- CONSENTIMENTOS ----
export function useConsentimentos(pessoaId?: string) {
  return useQuery({
    queryKey: ["pessoas_consentimentos", pessoaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("pessoas_consentimentos").select("*").eq("pessoa_id", pessoaId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!pessoaId,
  });
}

export function useCreateConsentimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { pessoa_id: string; finalidade: FinalidadeLgpd; base_legal?: string; consentido: boolean; canal_coleta?: string }) => {
      const { data, error } = await supabase.from("pessoas_consentimentos").insert({ ...values, data_consentimento: values.consentido ? new Date().toISOString() : null }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["pessoas_consentimentos", v.pessoa_id] }),
  });
}

// ---- TAGS ----
export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("nome");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nome: string; cor?: string; categoria?: string }) => {
      const { data, error } = await supabase.from("tags").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useAddPessoaTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pessoaId, tagId }: { pessoaId: string; tagId: string }) => {
      const { error } = await supabase.from("pessoas_tags").insert({ pessoa_id: pessoaId, tag_id: tagId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pessoas"] }),
  });
}

export function useRemovePessoaTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pessoaId, tagId }: { pessoaId: string; tagId: string }) => {
      const { error } = await supabase.from("pessoas_tags").delete().eq("pessoa_id", pessoaId).eq("tag_id", tagId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pessoas"] }),
  });
}
