import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Database } from "lucide-react";

const exportable = [
  { name: "pessoas", label: "Pessoas (CRM)", dateField: "created_at" },
  { name: "demandas", label: "Demandas", dateField: "created_at" },
  { name: "agenda", label: "Agenda", dateField: "data_inicio" },
  { name: "municipios", label: "Municípios", dateField: null },
  { name: "bairros", label: "Bairros", dateField: null },
  { name: "despesas", label: "Despesas", dateField: "data_despesa" },
  { name: "receitas", label: "Receitas", dateField: "data" },
  { name: "materiais", label: "Materiais", dateField: null },
  { name: "campanha_tarefas", label: "Tarefas Campanha", dateField: "data_prevista" },
  { name: "audit_logs", label: "Auditoria", dateField: "created_at" },
] as const;

function toCSV(rows: any[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export function ExportTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const exportTable = async (cfg: typeof exportable[number]) => {
    setLoading(cfg.name);
    try {
      let q = supabase.from(cfg.name as any).select("*").limit(10000);
      if (cfg.dateField && from) q = q.gte(cfg.dateField, from);
      if (cfg.dateField && to) q = q.lte(cfg.dateField, to);
      const { data, error } = await q;
      if (error) throw error;
      const rows = data || [];
      const isCsv = format === "csv";
      const content = isCsv ? toCSV(rows) : JSON.stringify(rows, null, 2);
      const blob = new Blob([content], { type: isCsv ? "text/csv;charset=utf-8" : "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cfg.name}_${new Date().toISOString().slice(0, 10)}.${isCsv ? "csv" : "json"}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `Exportado: ${cfg.label}`, description: `${rows.length} registros` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao exportar", description: e.message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Exportação de Dados (LGPD)</CardTitle>
        <CardDescription>Exporte em CSV ou JSON, com filtro de data quando aplicável.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label>Formato</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label>Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {exportable.map((t) => (
            <Button
              key={t.name}
              variant="outline"
              onClick={() => exportTable(t)}
              disabled={loading === t.name}
              className="justify-start h-auto py-3"
            >
              {loading === t.name ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              <span className="flex flex-col items-start">
                <span>{t.label}</span>
                {t.dateField && (from || to) && <span className="text-[10px] text-muted-foreground">filtro: {t.dateField}</span>}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
