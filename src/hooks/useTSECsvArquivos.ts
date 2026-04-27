import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as tus from "tus-js-client";

export type TseCsvStatus =
  | "aguardando"
  | "processando"
  | "pausado"
  | "concluido"
  | "erro";

export type TseCsvTipo =
  | "eleitorado_perfil"
  | "votacao_candidato_perfil"
  | "eleitorado"
  | "locais"
  | "candidatos"
  | "resultados";

export interface TseCsvArquivo {
  id: string;
  nome_original: string;
  tipo: TseCsvTipo;
  ano: number;
  uf: string;
  storage_path: string;
  tabela_destino: string;
  tamanho_bytes: number | null;
  total_linhas: number | null;
  linhas_processadas: number;
  byte_cursor: number;
  status: TseCsvStatus;
  progress_pct: number;
  municipios_filtro: string[] | null;
  chunk_size: number;
  error_msg: string | null;
  attempts: number;
  ultima_atividade_em: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const TABELA_POR_TIPO: Record<TseCsvTipo, string> = {
  eleitorado_perfil: "tse_eleitorado_perfil",
  votacao_candidato_perfil: "tse_votacao_candidato_perfil",
  eleitorado: "tse_eleitorado",
  locais: "tse_locais_votacao",
  candidatos: "tse_candidatos",
  resultados: "tse_resultados_secao",
};

export function useTSECsvArquivos() {
  return useQuery({
    queryKey: ["tse-csv-arquivos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tse_csv_arquivos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as TseCsvArquivo[];
    },
    refetchInterval: 3000,
  });
}

export function useRunTSECsvWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("tse-csv-worker", {
        body: { trigger: "manual" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-csv-arquivos"] }),
  });
}

export function usePausarTSECsvArquivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tse_csv_arquivos")
        .update({ status: "pausado" })
        .eq("id", id)
        .in("status", ["aguardando", "processando"]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-csv-arquivos"] }),
  });
}

export function useRetomarTSECsvArquivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tse_csv_arquivos")
        .update({ status: "aguardando", error_msg: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-csv-arquivos"] }),
  });
}

export function useReprocessarTSECsvArquivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tse_csv_arquivos")
        .update({
          status: "aguardando",
          byte_cursor: 0,
          linhas_processadas: 0,
          progress_pct: 0,
          error_msg: null,
          header_line: null,
          attempts: 0,
          started_at: null,
          finished_at: null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-csv-arquivos"] }),
  });
}

export function useExcluirTSECsvArquivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (arquivo: TseCsvArquivo) => {
      // remove do storage primeiro
      await supabase.storage.from("tse-csv-uploads").remove([arquivo.storage_path]);
      const { error } = await supabase
        .from("tse_csv_arquivos")
        .delete()
        .eq("id", arquivo.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-csv-arquivos"] }),
  });
}

export function useDownloadTSECsv() {
  return useMutation({
    mutationFn: async (arquivo: TseCsvArquivo) => {
      const { data, error } = await supabase.storage
        .from("tse-csv-uploads")
        .createSignedUrl(arquivo.storage_path, 300);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    },
  });
}

// Upload + criação do registro de fila. retorna o arquivo criado.
export async function arquivarCsvParaProcessamento(opts: {
  file: File;
  tipo: TseCsvTipo;
  ano: number;
  uf: string;
  municipios_filtro?: string[] | null;
  chunk_size?: number;
  onProgress?: (pct: number) => void;
}): Promise<TseCsvArquivo> {
  const { file, tipo, ano, uf } = opts;
  const { data: sessionData } = await supabase.auth.getSession();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error("Usuário não autenticado");
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre novamente para enviar arquivos grandes.");

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storage_path = `${userId}/${ts}_${safeName}`;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://lryjfthdzmrgudamuqiu.supabase.co";
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
      chunkSize: 6 * 1024 * 1024,
      removeFingerprintOnSuccess: true,
      headers: {
        authorization: `Bearer ${token}`,
        apikey: anonKey,
        "x-upsert": "false",
      },
      metadata: {
        bucketName: "tse-csv-uploads",
        objectName: storage_path,
        contentType: file.type || "text/csv",
        cacheControl: "3600",
      },
      onError: (error) => reject(error),
      onProgress: (sent, total) => opts.onProgress?.(Math.min(99, Math.round((sent / total) * 100))),
      onSuccess: () => {
        opts.onProgress?.(100);
        resolve();
      },
    });
    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    }).catch(reject);
  });

  const { data, error } = await supabase
    .from("tse_csv_arquivos")
    .insert({
      nome_original: file.name,
      tipo,
      ano,
      uf,
      storage_path,
      tabela_destino: TABELA_POR_TIPO[tipo],
      tamanho_bytes: file.size,
      municipios_filtro:
        opts.municipios_filtro && opts.municipios_filtro.length > 0
          ? opts.municipios_filtro
          : null,
      chunk_size: opts.chunk_size ?? 500,
      created_by: userId,
      status: "aguardando",
    })
    .select("*")
    .single();
  if (error) throw error;

  // Dispara o worker uma vez (fast-start)
  supabase.functions.invoke("tse-csv-worker", { body: { trigger: "fast-start" } }).catch(() => {});

  return data as TseCsvArquivo;
}
