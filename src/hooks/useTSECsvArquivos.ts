import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

export type TseCsvStatus =
  | "aguardando"
  | "processando"
  | "pausado"
  | "concluido"
  | "erro";

export type TseCsvTipo =
  | "eleitorado_perfil"
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

function normalizeArquivo(raw: any): TseCsvArquivo {
  return {
    id: raw.id,
    nome_original: raw.nome_original ?? raw.nomeOriginal ?? "unknown.csv",
    tipo: raw.tipo,
    ano: raw.ano,
    uf: raw.uf,
    storage_path: raw.storage_path ?? raw.storagePath ?? "",
    tabela_destino: raw.tabela_destino ?? raw.tabelaDestino ?? "",
    tamanho_bytes: raw.tamanho_bytes ?? raw.tamanhoBytes ?? null,
    total_linhas: raw.total_linhas ?? raw.totalLinhas ?? null,
    linhas_processadas: raw.linhas_processadas ?? raw.linhasProcessadas ?? 0,
    byte_cursor: raw.byte_cursor ?? raw.byteCursor ?? 0,
    status: raw.status,
    progress_pct: raw.progress_pct ?? raw.progressPct ?? 0,
    municipios_filtro: raw.municipios_filtro ?? raw.municipiosFiltro ?? null,
    chunk_size: raw.chunk_size ?? raw.chunkSize ?? 0,
    error_msg: raw.error_msg ?? raw.errorMsg ?? null,
    attempts: raw.attempts ?? 0,
    ultima_atividade_em: raw.ultima_atividade_em ?? raw.ultimaAtividadeEm ?? null,
    started_at: raw.started_at ?? raw.startedAt ?? null,
    finished_at: raw.finished_at ?? raw.finishedAt ?? null,
    created_by: raw.created_by ?? raw.createdBy ?? null,
    created_at: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    updated_at: raw.updated_at ?? raw.updatedAt ?? new Date().toISOString(),
  };
}

export const TABELA_POR_TIPO: Record<TseCsvTipo, string> = {
  eleitorado_perfil: "tse_eleitorado_perfil",
  eleitorado: "tse_eleitorado_secao",
  locais: "tse_locais_votacao",
  candidatos: "tse_candidatos",
  resultados: "tse_resultados_secao",
};

export function useTSECsvArquivos() {
  return useQuery({
    queryKey: ["tse-csv-arquivos"],
    queryFn: async () => {
      const data = await api.get<any[]>("/tse/arquivos");
      return (data || []).map(normalizeArquivo);
    },
    refetchInterval: 3000,
  });
}

export function useRunTSECsvWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const data = await api.post("/tse/jobs/run", { trigger: "manual" });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-csv-arquivos"] }),
  });
}

export function usePausarTSECsvArquivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Dummy logic until backend is fully robust for partial pausing
      await api.patch(`/tse/arquivos/${id}`, { status: "pausado" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-csv-arquivos"] }),
  });
}

export function useRetomarTSECsvArquivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/tse/arquivos/${id}`, { status: "aguardando", error_msg: null });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-csv-arquivos"] }),
  });
}

export function useReprocessarTSECsvArquivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/tse/arquivos/${id}`, {
          status: "aguardando",
          byte_cursor: 0,
          linhas_processadas: 0,
          progress_pct: 0,
          error_msg: null,
          header_line: null,
          attempts: 0,
          started_at: null,
          finished_at: null,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-csv-arquivos"] }),
  });
}

export function useExcluirTSECsvArquivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (arquivo: TseCsvArquivo) => {
      await api.delete(`/tse/arquivos/${arquivo.id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tse-csv-arquivos"] }),
  });
}

export function useDownloadTSECsv() {
  return useMutation({
    mutationFn: async (arquivo: TseCsvArquivo) => {
      const { blob, filename } = await api.download(`/tse/arquivos/${arquivo.id}/download`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || arquivo.nome_original || "tse-import.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
  });
}

const PART_SIZE = 40 * 1024 * 1024;

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

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const baseDir = `${ts}_${safeName}`;

  const totalParts = Math.max(1, Math.ceil(file.size / PART_SIZE));
  const partsPaths: string[] = [];
  const partsSizes: number[] = [];

  for (let i = 0; i < totalParts; i++) {
    const start = i * PART_SIZE;
    const end = Math.min(file.size, start + PART_SIZE);
    const blob = file.slice(start, end);

    const formData = new FormData();
    // Pass as file
    formData.append("file", blob, `part-${String(i).padStart(5, "0")}.csv`);
    formData.append("baseDir", baseDir);
    formData.append("partIndex", String(i));
    formData.append("totalParts", String(totalParts));

    let attempt = 0;
    while (true) {
      try {
        const res = await api.upload<any>("/tse/upload-chunk", formData);
        partsPaths.push(res.path);
        partsSizes.push(end - start);
        break;
      } catch (error: any) {
        attempt++;
        if (attempt >= 3) {
          throw new Error(`Falha ao enviar parte ${i + 1}/${totalParts}: ${error.message}`);
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }

    const pct = Math.min(99, Math.round(((i + 1) / totalParts) * 100));
    opts.onProgress?.(pct);
  }
  opts.onProgress?.(100);

  const metaData = {
      nome_original: file.name,
      tipo,
      ano,
      uf,
      storage_path: partsPaths[0],
      tabela_destino: TABELA_POR_TIPO[tipo],
      tamanho_bytes: file.size,
      parts_total: totalParts,
      parts_paths: partsPaths,
      parts_sizes: partsSizes,
      municipios_filtro: opts.municipios_filtro && opts.municipios_filtro.length > 0 ? opts.municipios_filtro : null,
      chunk_size: opts.chunk_size ?? 500,
  };

  const arquivoCriado = await api.post<TseCsvArquivo>("/tse/arquivos", metaData);
  
  // Fast-start
  api.post("/tse/jobs/run", { trigger: "fast-start" }).catch(() => {});

  return normalizeArquivo(arquivoCriado);
}
