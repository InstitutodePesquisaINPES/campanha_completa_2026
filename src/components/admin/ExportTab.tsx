import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Database } from "lucide-react";

const exportable = [
  { name: "pessoas", label: "Pessoas (CRM)" },
  { name: "demandas", label: "Demandas" },
  { name: "agenda", label: "Agenda" },
  { name: "municipios", label: "Municípios" },
  { name: "bairros", label: "Bairros" },
  { name: "despesas", label: "Despesas" },
  { name: "receitas", label: "Receitas" },
  { name: "materiais", label: "Materiais" },
  { name: "campanha_tarefas", label: "Tarefas de Campanha" },
  { name: "audit_logs", label: "Logs de Auditoria" },
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

  const exportTable = async (table: string, label: string) => {
    setLoading(table);
    try {
      const { data, error } = await supabase.from(table as any).select("*").limit(10000);
      if (error) throw error;
      const csv = toCSV(data || []);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `Exportado: ${label}`, description: `${data?.length || 0} registros` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao exportar", description: e.message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Exportação de Dados (LGPD)
        </CardTitle>
        <CardDescription>Exporte dados em formato CSV para backup ou compliance.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {exportable.map((t) => (
            <Button
              key={t.name}
              variant="outline"
              onClick={() => exportTable(t.name, t.label)}
              disabled={loading === t.name}
              className="justify-start h-auto py-3"
            >
              {loading === t.name ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {t.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
