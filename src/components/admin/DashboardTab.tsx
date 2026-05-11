import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, FileText, Calendar, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { SystemHealthCard } from "./SystemHealthCard";

const TABLES = [
  { table: "pessoas", label: "Pessoas", icon: Users },
  { table: "demandas", label: "Demandas", icon: FileText },
  { table: "agenda", label: "Eventos", icon: Calendar },
  { table: "despesas", label: "Despesas", icon: DollarSign },
] as const;

export function DashboardTab() {
  const { data: counts, isLoading: lc } = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      try {
        const data = await api.get<Record<string, number>>("/admin/stats/counts");
        return data || {};
      } catch {
        return {} as Record<string, number>;
      }
    },
  });

  const { data: serie = [], isLoading: ls } = useQuery({
    queryKey: ["admin-stats-30d"],
    queryFn: async () => {
      try {
        const data = await api.get<any[]>("/admin/stats/30d");
        return (data || []).map((r: any) => ({
          dia: new Date(r.dia).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          pessoas: Number(r.pessoas),
          demandas: Number(r.demandas),
          eventos: Number(r.eventos),
        }));
      } catch {
        return [];
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TABLES.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.table}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t.label}</p>
                    <p className="text-2xl font-bold">
                      {lc ? <Loader2 className="h-5 w-5 animate-spin" /> : (counts?.[t.table] ?? 0).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Icon className="h-8 w-8 text-primary/40" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução — últimos 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            {ls ? (
              <div className="h-72 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={serie}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dia" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="pessoas" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="demandas" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="eventos" stroke="hsl(var(--accent-foreground))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <SystemHealthCard />
      </div>
    </div>
  );
}
