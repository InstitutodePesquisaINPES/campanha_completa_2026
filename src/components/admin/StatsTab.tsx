import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, MapPin, FileText, DollarSign, Calendar, Package, Building2, Activity } from "lucide-react";

const tables = [
  { name: "pessoas", label: "Pessoas (CRM)", icon: Users },
  { name: "demandas", label: "Demandas", icon: FileText },
  { name: "agenda", label: "Eventos Agenda", icon: Calendar },
  { name: "municipios", label: "Municípios", icon: Building2 },
  { name: "bairros", label: "Bairros", icon: MapPin },
  { name: "materiais", label: "Materiais", icon: Package },
  { name: "despesas", label: "Despesas", icon: DollarSign },
  { name: "receitas", label: "Receitas", icon: DollarSign },
  { name: "campanhas", label: "Campanhas", icon: Activity },
  { name: "audit_logs", label: "Logs Auditoria", icon: FileText },
] as const;

export function StatsTab() {
  const { data: counts, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const results = await Promise.all(
        tables.map(async (t) => {
          const { count } = await supabase.from(t.name as any).select("*", { count: "exact", head: true });
          return { name: t.name, count: count || 0 };
        })
      );
      return Object.fromEntries(results.map((r) => [r.name, r.count]));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {tables.map((t) => {
        const Icon = t.icon;
        return (
          <Card key={t.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {t.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{counts?.[t.name].toLocaleString("pt-BR")}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
