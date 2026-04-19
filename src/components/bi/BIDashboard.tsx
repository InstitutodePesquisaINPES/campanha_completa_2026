import { useRef, useState } from "react";
import { useBIStats } from "@/hooks/useBIStats";
import { useExportBI } from "@/hooks/useExportBI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, ClipboardList, Calendar, MapPin, DollarSign, TrendingUp, TrendingDown, CheckCircle, Download, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { categoriaLabels, statusLabels } from "@/hooks/useDemandas";
import { tipoAgendaLabels } from "@/hooks/useAgenda";
import { categoriaDespesaLabels, tipoReceitaLabels } from "@/hooks/useFinanceiro";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316", "#6366F1"];

const nivelLabels: Record<string, string> = {
  desconhecido: "Desconhecido", frio: "Frio", morno: "Morno", quente: "Quente", aliado: "Aliado", lideranca: "Liderança",
};
const classificacaoLabels: Record<string, string> = {
  reduto: "Reduto", expansao: "Expansão", disputa: "Disputa", risco: "Risco", baixa_presenca: "Baixa Presença", sem_classificacao: "S/ Classif.",
};

function toChartData(obj: Record<string, number>, labels?: Record<string, string>) {
  return Object.entries(obj).map(([key, value]) => ({ name: labels?.[key] || key, value }));
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color || "bg-primary/15 text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function BIDashboard() {
  const { data: stats, isLoading } = useBIStats();
  const { exportElement, exporting } = useExportBI();
  const dashRef = useRef<HTMLDivElement>(null);

  const doExport = (format: "png" | "pdf", upload = false) => {
    if (!dashRef.current) return;
    exportElement(dashRef.current, {
      format,
      title: "Relatório BI — SIGT",
      filename: `bi-dashboard-${new Date().toISOString().slice(0, 10)}`,
      upload,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">BI / Dashboards</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;
  const { totals } = stats;

  const demandasStatusData = toChartData(stats.demandasPorStatus, statusLabels);
  const demandasCatData = toChartData(stats.demandasPorCategoria, categoriaLabels);
  const pessoasNivelData = toChartData(stats.pessoasPorNivel, nivelLabels);
  const agendaTipoData = toChartData(stats.agendaPorTipo, tipoAgendaLabels);
  const despesasCatData = toChartData(stats.despesasPorCategoria, categoriaDespesaLabels);
  const bairrosClassData = toChartData(stats.bairrosPorClassificacao, classificacaoLabels);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">BI / Dashboards</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => doExport("png")}>PNG</DropdownMenuItem>
            <DropdownMenuItem onClick={() => doExport("pdf")}>PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={() => doExport("pdf", true)}>PDF + salvar na nuvem</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div ref={dashRef} className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Pessoas" value={totals.pessoas} />
          <StatCard icon={ClipboardList} label="Demandas" value={totals.demandas} sub={`${totals.demandasResolvidas} resolvidas`} />
          <StatCard icon={Calendar} label="Eventos/Agenda" value={totals.agenda} />
          <StatCard icon={MapPin} label="Bairros" value={totals.bairros} sub={`${totals.municipios} municípios`} />
          <StatCard icon={TrendingUp} label="Receitas" value={formatCurrency(totals.totalReceitas)} color="bg-green-500/15 text-green-500" />
          <StatCard icon={TrendingDown} label="Despesas" value={formatCurrency(totals.totalDespesas)} color="bg-red-500/15 text-red-500" />
          <StatCard icon={DollarSign} label="Saldo" value={formatCurrency(totals.saldo)} color={totals.saldo >= 0 ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"} />
          <StatCard icon={CheckCircle} label="Taxa Resolução" value={totals.demandas > 0 ? `${Math.round((totals.demandasResolvidas / totals.demandas) * 100)}%` : "–"} color="bg-blue-500/15 text-blue-500" />
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm">Evolução Mensal (6 meses)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222 47% 8%)", border: "1px solid hsl(222 30% 18%)", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="pessoas" stroke="#3B82F6" strokeWidth={2} name="Pessoas" />
                <Line type="monotone" dataKey="demandas" stroke="#EF4444" strokeWidth={2} name="Demandas" />
                <Line type="monotone" dataKey="eventos" stroke="#10B981" strokeWidth={2} name="Eventos" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Demandas por Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={demandasStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {demandasStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Demandas por Categoria</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={demandasCatData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(222 47% 8%)", border: "1px solid hsl(222 30% 18%)", borderRadius: 8 }} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Pessoas por Nível</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pessoasNivelData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pessoasNivelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Agenda por Tipo</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={agendaTipoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(222 47% 8%)", border: "1px solid hsl(222 30% 18%)", borderRadius: 8 }} />
                  <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Despesas por Categoria (R$)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={despesasCatData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(222 47% 8%)", border: "1px solid hsl(222 30% 18%)", borderRadius: 8 }} formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Bairros por Classificação</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={bairrosClassData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {bairrosClassData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
