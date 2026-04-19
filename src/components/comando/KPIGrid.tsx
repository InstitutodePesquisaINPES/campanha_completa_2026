import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Calendar, CheckCircle2, ClipboardList, DollarSign, Target, TrendingUp, Users } from "lucide-react";

interface KPIGridProps {
  data: {
    dias_restantes: number;
    total_pessoas: number;
    meta_votos: number | null;
    demandas_abertas: number;
    demandas_urgentes: number;
    demandas_resolvidas: number;
    eventos_futuros: number;
    tarefas_concluidas: number;
    tarefas_total: number;
    tarefas_atrasadas: number;
    total_gasto: number;
    orcamento_total: number;
  };
}

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

export function KPIGrid({ data }: KPIGridProps) {
  const metaPct = data.meta_votos ? Math.min(100, (data.total_pessoas / data.meta_votos) * 100) : 0;
  const tarefasPct = data.tarefas_total ? (data.tarefas_concluidas / data.tarefas_total) * 100 : 0;
  const orcPct = data.orcamento_total ? Math.min(100, (data.total_gasto / data.orcamento_total) * 100) : 0;

  const cards = [
    {
      label: "Dias restantes",
      value: data.dias_restantes >= 0 ? data.dias_restantes : "—",
      sub: "até a eleição",
      icon: Calendar,
      tone: data.dias_restantes < 30 ? "text-destructive" : "text-primary",
    },
    {
      label: "Cadastrados",
      value: data.total_pessoas.toLocaleString("pt-BR"),
      sub: data.meta_votos ? `${metaPct.toFixed(0)}% da meta (${data.meta_votos.toLocaleString("pt-BR")})` : "sem meta",
      icon: Users,
      tone: "text-primary",
      progress: metaPct,
    },
    {
      label: "Tarefas",
      value: `${data.tarefas_concluidas}/${data.tarefas_total}`,
      sub: data.tarefas_atrasadas > 0 ? `${data.tarefas_atrasadas} atrasadas` : "no prazo",
      icon: ClipboardList,
      tone: data.tarefas_atrasadas > 0 ? "text-destructive" : "text-primary",
      progress: tarefasPct,
    },
    {
      label: "Demandas abertas",
      value: data.demandas_abertas,
      sub: `${data.demandas_urgentes} urgentes • ${data.demandas_resolvidas} resolvidas`,
      icon: data.demandas_urgentes > 0 ? AlertTriangle : CheckCircle2,
      tone: data.demandas_urgentes > 0 ? "text-destructive" : "text-primary",
    },
    {
      label: "Eventos futuros",
      value: data.eventos_futuros,
      sub: "agendados",
      icon: TrendingUp,
      tone: "text-primary",
    },
    {
      label: "Orçamento",
      value: fmtBRL(data.total_gasto),
      sub: data.orcamento_total ? `${orcPct.toFixed(0)}% de ${fmtBRL(data.orcamento_total)}` : "sem orçamento",
      icon: DollarSign,
      tone: orcPct > 90 ? "text-destructive" : "text-primary",
      progress: orcPct,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-3xl font-bold">{c.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
                </div>
                <Icon className={`h-5 w-5 ${c.tone}`} />
              </div>
              {typeof c.progress === "number" && <Progress value={c.progress} className="mt-3 h-1.5" />}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
