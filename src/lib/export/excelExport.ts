import * as XLSX from "xlsx";
import { api } from "@/lib/apiClient";

export type ExportFormat = "xlsx" | "csv" | "json";

export interface ExportTableConfig {
  name: string;
  label: string;
  dateField?: string | null;
  select?: string;
  group?: "crm" | "campo" | "financeiro" | "territorio" | "campanha" | "auditoria" | "comunicacao";
}

export const EXPORT_TABLES: ExportTableConfig[] = [
  // CRM
  { name: "pessoas", label: "Pessoas (CRM)", dateField: "created_at", group: "crm" },
  { name: "pessoas_contatos", label: "Contatos", dateField: "created_at", group: "crm" },
  { name: "pessoas_enderecos", label: "Endereços", dateField: "created_at", group: "crm" },
  { name: "pessoas_papeis", label: "Papéis/Funções", dateField: "created_at", group: "crm" },
  { name: "pessoas_tags", label: "Tags de Pessoas", dateField: "created_at", group: "crm" },
  { name: "pessoas_historico_contatos", label: "Histórico de Contatos", dateField: "data_contato", group: "crm" },
  { name: "pessoas_consentimentos", label: "Consentimentos LGPD", dateField: "created_at", group: "crm" },
  { name: "tags", label: "Tags", dateField: "created_at", group: "crm" },

  // Campo
  { name: "demandas", label: "Demandas", dateField: "created_at", group: "campo" },
  { name: "demandas_encaminhamentos", label: "Encaminhamentos", dateField: "created_at", group: "campo" },
  { name: "agenda", label: "Agenda", dateField: "data_inicio", group: "campo" },
  { name: "agenda_participantes", label: "Participantes da Agenda", dateField: "created_at", group: "campo" },
  { name: "agenda_checkins", label: "Check-ins", dateField: "created_at", group: "campo" },
  { name: "agenda_followups", label: "Follow-ups", dateField: "created_at", group: "campo" },

  // Território
  { name: "estados", label: "Estados", dateField: null, group: "territorio" },
  { name: "municipios", label: "Municípios", dateField: null, group: "territorio" },
  { name: "distritos", label: "Distritos", dateField: null, group: "territorio" },
  { name: "bairros", label: "Bairros", dateField: null, group: "territorio" },
  { name: "comunidades", label: "Comunidades", dateField: null, group: "territorio" },
  { name: "areas_atuacao", label: "Áreas de Atuação", dateField: "created_at", group: "territorio" },

  // Financeiro
  { name: "despesas", label: "Despesas", dateField: "data_despesa", group: "financeiro" },
  { name: "centros_custo", label: "Centros de Custo", dateField: "created_at", group: "financeiro" },
  { name: "materiais", label: "Materiais", dateField: "created_at", group: "financeiro" },
  { name: "estoques", label: "Estoques", dateField: "created_at", group: "financeiro" },
  { name: "movimentacoes_estoque", label: "Movimentações de Estoque", dateField: "created_at", group: "financeiro" },

  // Campanha
  { name: "campanhas", label: "Campanhas", dateField: "created_at", group: "campanha" },
  { name: "campanha_tarefas", label: "Tarefas (Plano 90d)", dateField: "data_prevista", group: "campanha" },
  { name: "campanha_fases", label: "Fases", dateField: null, group: "campanha" },
  { name: "campanha_metas", label: "Metas", dateField: "created_at", group: "campanha" },
  { name: "campanha_semanas", label: "Semanas", dateField: null, group: "campanha" },
  { name: "campanha_parametros", label: "Parâmetros do Gerador", dateField: "created_at", group: "campanha" },

  // Auditoria
  { name: "audit_logs", label: "Logs de Auditoria", dateField: "created_at", group: "auditoria" },
];

export const GROUP_LABELS: Record<string, string> = {
  crm: "👥 CRM & Pessoas",
  campo: "📍 Campo & Demandas",
  territorio: "🗺️ Território",
  financeiro: "💰 Financeiro & Materiais",
  campanha: "🗳️ Campanha",
  comunicacao: "📢 Comunicação",
  auditoria: "🔒 Auditoria & LGPD",
};

interface FetchOptions {
  from?: string;
  to?: string;
  limit?: number;
}

export async function fetchTableData(cfg: ExportTableConfig, opts: FetchOptions = {}): Promise<any[]> {
  const limit = opts.limit ?? 50000;
  const params = new URLSearchParams({ limit: String(limit) });
  if (cfg.dateField && opts.from) params.set("from", opts.from);
  if (cfg.dateField && opts.to) params.set("to", opts.to);
  if (cfg.dateField) params.set("dateField", cfg.dateField);
  try {
    const data = await api.get<any[]>(`/export/${cfg.name}?${params.toString()}`);
    return data || [];
  } catch {
    return [];
  }
}

function flattenRow(row: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of Object.keys(row)) {
    const v = row[k];
    if (v === null || v === undefined) {
      out[k] = "";
    } else if (Array.isArray(v)) {
      out[k] = v.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join("; ");
    } else if (typeof v === "object") {
      out[k] = JSON.stringify(v);
    } else if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
      out[k] = new Date(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function autoFitColumns(rows: any[]): { wch: number }[] {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]);
  return headers.map((h) => {
    const maxLen = Math.max(
      h.length,
      ...rows.slice(0, 200).map((r) => {
        const v = r[h];
        if (v instanceof Date) return 19;
        const s = v === null || v === undefined ? "" : String(v);
        return Math.min(s.length, 60);
      }),
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
  });
}

export function buildSheet(rows: any[]): XLSX.WorkSheet {
  const flat = rows.map(flattenRow);
  const ws = XLSX.utils.json_to_sheet(flat, { cellDates: true });
  ws["!cols"] = autoFitColumns(flat);
  if (flat.length > 0) {
    const range = XLSX.utils.decode_range(ws["!ref"]!);
    ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: range.e.c, r: 0 } }) };
    ws["!freeze"] = { xSplit: 0, ySplit: 1 } as any;
  }
  return ws;
}

function buildSummarySheet(stats: { table: string; label: string; rows: number; group: string }[], opts: FetchOptions): XLSX.WorkSheet {
  const total = stats.reduce((a, b) => a + b.rows, 0);
  const header = [
    ["RELATÓRIO CONSOLIDADO DE EXPORTAÇÃO"],
    [`Gerado em: ${new Date().toLocaleString("pt-BR")}`],
    [`Período: ${opts.from || "início"} a ${opts.to || "hoje"}`],
    [`Total de registros: ${total.toLocaleString("pt-BR")}`],
    [],
    ["Grupo", "Tabela", "Rótulo", "Registros"],
    ...stats.map((s) => [GROUP_LABELS[s.group] || s.group, s.table, s.label, s.rows]),
    [],
    ["TOTAL", "", "", total],
  ];
  const ws = XLSX.utils.aoa_to_sheet(header);
  ws["!cols"] = [{ wch: 28 }, { wch: 28 }, { wch: 36 }, { wch: 14 }];
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  return ws;
}

export async function exportToExcel(
  configs: ExportTableConfig[],
  opts: FetchOptions = {},
  filename = `export_${new Date().toISOString().slice(0, 10)}.xlsx`,
  onProgress?: (current: number, total: number, label: string) => void,
): Promise<{ totalRows: number; sheets: number }> {
  const wb = XLSX.utils.book_new();
  const stats: { table: string; label: string; rows: number; group: string }[] = [];

  for (let i = 0; i < configs.length; i++) {
    const cfg = configs[i];
    onProgress?.(i + 1, configs.length, cfg.label);
    try {
      const rows = await fetchTableData(cfg, opts);
      const ws = buildSheet(rows);
      const sheetName = cfg.label.slice(0, 31).replace(/[\\/*?:[\]]/g, "");
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      stats.push({ table: cfg.name, label: cfg.label, rows: rows.length, group: cfg.group ?? "outros" });
    } catch (e: any) {
      const ws = XLSX.utils.aoa_to_sheet([["Erro ao exportar"], [e.message]]);
      XLSX.utils.book_append_sheet(wb, ws, `ERRO_${cfg.name}`.slice(0, 31));
      stats.push({ table: cfg.name, label: cfg.label, rows: 0, group: cfg.group ?? "outros" });
    }
  }

  const summary = buildSummarySheet(stats, opts);
  XLSX.utils.book_append_sheet(wb, summary, "📊 Resumo");
  // Move summary to first
  wb.SheetNames = ["📊 Resumo", ...wb.SheetNames.filter((n) => n !== "📊 Resumo")];

  XLSX.writeFile(wb, filename, { compression: true });
  return { totalRows: stats.reduce((a, b) => a + b.rows, 0), sheets: configs.length + 1 };
}

export function exportToCSV(rows: any[], filename: string) {
  const ws = buildSheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws, { FS: ",", RS: "\n" });
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, filename);
}

export function exportToJSON(rows: any[], filename: string) {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
