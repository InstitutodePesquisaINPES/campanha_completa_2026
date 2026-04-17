import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Database, FileSpreadsheet, FileJson, FileText, Sparkles, CheckSquare, Square } from "lucide-react";
import {
  EXPORT_TABLES,
  GROUP_LABELS,
  exportToExcel,
  exportToCSV,
  exportToJSON,
  fetchTableData,
  type ExportFormat,
  type ExportTableConfig,
} from "@/lib/export/excelExport";

const PRESETS: { id: string; label: string; desc: string; tables: string[] }[] = [
  {
    id: "completo",
    label: "📦 Backup Completo",
    desc: "Todas as tabelas — relatório executivo completo",
    tables: EXPORT_TABLES.map((t) => t.name),
  },
  {
    id: "crm",
    label: "👥 CRM Completo",
    desc: "Pessoas, contatos, endereços, histórico, LGPD",
    tables: EXPORT_TABLES.filter((t) => t.group === "crm").map((t) => t.name),
  },
  {
    id: "campo",
    label: "📍 Operação de Campo",
    desc: "Demandas, agenda, check-ins e follow-ups",
    tables: EXPORT_TABLES.filter((t) => t.group === "campo").map((t) => t.name),
  },
  {
    id: "financeiro",
    label: "💰 Financeiro & Materiais",
    desc: "Despesas, centros de custo, estoques",
    tables: EXPORT_TABLES.filter((t) => t.group === "financeiro").map((t) => t.name),
  },
  {
    id: "campanha",
    label: "🗳️ Plano de Campanha",
    desc: "Campanhas, tarefas, fases, metas e parâmetros",
    tables: EXPORT_TABLES.filter((t) => t.group === "campanha").map((t) => t.name),
  },
  {
    id: "lgpd",
    label: "🔒 LGPD (titular de dados)",
    desc: "Pessoas, contatos, endereços, consentimentos e auditoria",
    tables: ["pessoas", "pessoas_contatos", "pessoas_enderecos", "pessoas_consentimentos", "pessoas_historico_contatos", "audit_logs"],
  },
];

export function ExportTab() {
  const { toast } = useToast();
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(EXPORT_TABLES.map((t) => t.name)));
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [singleLoading, setSingleLoading] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, ExportTableConfig[]>();
    for (const t of EXPORT_TABLES) {
      const g = t.group ?? "outros";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(t);
    }
    return Array.from(map.entries());
  }, []);

  const toggle = (name: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });

  const toggleGroup = (tables: ExportTableConfig[]) =>
    setSelected((prev) => {
      const n = new Set(prev);
      const allIn = tables.every((t) => n.has(t.name));
      tables.forEach((t) => (allIn ? n.delete(t.name) : n.add(t.name)));
      return n;
    });

  const selectAll = () => setSelected(new Set(EXPORT_TABLES.map((t) => t.name)));
  const selectNone = () => setSelected(new Set());
  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (p) setSelected(new Set(p.tables));
  };

  const runExport = async () => {
    const configs = EXPORT_TABLES.filter((t) => selected.has(t.name));
    if (configs.length === 0) {
      toast({ variant: "destructive", title: "Selecione ao menos uma tabela" });
      return;
    }
    setLoading(true);
    setProgress(0);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === "xlsx") {
        const result = await exportToExcel(
          configs,
          { from: from || undefined, to: to || undefined },
          `lovable-export_${stamp}.xlsx`,
          (curr, total, label) => {
            setProgress(Math.round((curr / total) * 100));
            setProgressLabel(`${curr}/${total} — ${label}`);
          },
        );
        toast({
          title: "✅ Exportação concluída",
          description: `${result.sheets} planilhas · ${result.totalRows.toLocaleString("pt-BR")} registros`,
        });
      } else {
        // For csv/json multi-table: export each as separate file
        for (let i = 0; i < configs.length; i++) {
          const cfg = configs[i];
          setProgress(Math.round(((i + 1) / configs.length) * 100));
          setProgressLabel(`${i + 1}/${configs.length} — ${cfg.label}`);
          const rows = await fetchTableData(cfg, { from: from || undefined, to: to || undefined });
          if (format === "csv") exportToCSV(rows, `${cfg.name}_${stamp}.csv`);
          else exportToJSON(rows, `${cfg.name}_${stamp}.json`);
        }
        toast({ title: "✅ Exportação concluída", description: `${configs.length} arquivos gerados` });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro na exportação", description: e.message });
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressLabel("");
    }
  };

  const exportSingle = async (cfg: ExportTableConfig) => {
    setSingleLoading(cfg.name);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const rows = await fetchTableData(cfg, { from: from || undefined, to: to || undefined });
      if (format === "xlsx") {
        await exportToExcel([cfg], { from: from || undefined, to: to || undefined }, `${cfg.name}_${stamp}.xlsx`);
      } else if (format === "csv") {
        exportToCSV(rows, `${cfg.name}_${stamp}.csv`);
      } else {
        exportToJSON(rows, `${cfg.name}_${stamp}.json`);
      }
      toast({ title: `✅ ${cfg.label}`, description: `${rows.length.toLocaleString("pt-BR")} registros` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    } finally {
      setSingleLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Central de Exportação
            <Badge variant="secondary" className="ml-2">LGPD-ready</Badge>
          </CardTitle>
          <CardDescription>
            Exporte dados em Excel multi-planilha (com resumo executivo, autofiltro e congelamento), CSV ou JSON. Filtre por período e selecione exatamente o que precisa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Filtros gerais */}
          <div className="grid sm:grid-cols-4 gap-3">
            <div>
              <Label>Formato</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx"><span className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" />Excel (.xlsx)</span></SelectItem>
                  <SelectItem value="csv"><span className="flex items-center gap-2"><FileText className="h-4 w-4" />CSV</span></SelectItem>
                  <SelectItem value="json"><span className="flex items-center gap-2"><FileJson className="h-4 w-4" />JSON</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data inicial</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label>Data final</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={runExport} disabled={loading || selected.size === 0} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Exportar {selected.size} {selected.size === 1 ? "tabela" : "tabelas"}
              </Button>
            </div>
          </div>

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">{progressLabel}</p>
            </div>
          )}

          {/* Presets */}
          <div>
            <Label className="flex items-center gap-1.5 mb-2"><Sparkles className="h-3.5 w-3.5" /> Pacotes prontos</Label>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className="text-left rounded-md border bg-card p-3 hover:bg-accent transition-colors"
                >
                  <div className="font-medium text-sm">{p.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{p.tables.length} tabelas</div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Seleção por grupo */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Tabelas ({selected.size}/{EXPORT_TABLES.length})</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}><CheckSquare className="h-3.5 w-3.5 mr-1" />Todas</Button>
                <Button variant="ghost" size="sm" onClick={selectNone}><Square className="h-3.5 w-3.5 mr-1" />Nenhuma</Button>
              </div>
            </div>

            <div className="space-y-4">
              {grouped.map(([group, tables]) => {
                const allIn = tables.every((t) => selected.has(t.name));
                const someIn = tables.some((t) => selected.has(t.name));
                return (
                  <div key={group} className="rounded-md border">
                    <div className="flex items-center justify-between bg-muted/50 px-3 py-2 border-b">
                      <button onClick={() => toggleGroup(tables)} className="flex items-center gap-2 font-medium text-sm">
                        <Checkbox checked={allIn ? true : someIn ? "indeterminate" : false} />
                        {GROUP_LABELS[group] || group}
                        <Badge variant="outline" className="text-[10px]">{tables.filter((t) => selected.has(t.name)).length}/{tables.length}</Badge>
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1 p-2">
                      {tables.map((t) => (
                        <div key={t.name} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent group">
                          <Checkbox checked={selected.has(t.name)} onCheckedChange={() => toggle(t.name)} id={`exp-${t.name}`} />
                          <label htmlFor={`exp-${t.name}`} className="flex-1 text-sm cursor-pointer truncate">
                            {t.label}
                            {t.dateField && (from || to) && (
                              <span className="block text-[10px] text-muted-foreground">filtro: {t.dateField}</span>
                            )}
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                            onClick={() => exportSingle(t)}
                            disabled={singleLoading === t.name}
                            title="Exportar somente esta"
                          >
                            {singleLoading === t.name ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
