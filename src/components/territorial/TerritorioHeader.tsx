import { useStrategicMunicipios } from "@/hooks/useTerritorioStrategic";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Users, Map, AlertTriangle, TrendingUp } from "lucide-react";

export function TerritorioHeader() {
  const { data: municipios = [], isLoading } = useStrategicMunicipios();

  const foco = municipios.filter((m) => m.is_foco);
  const eleitoradoFoco = foco.reduce((acc, m) => acc + (m.eleitorado_total || 0), 0);
  const populacaoFoco = foco.reduce((acc, m) => acc + (m.populacao || 0), 0);
  const focoComBairros = foco.filter((m) => m.bairros_count > 0).length;
  const cobertura = foco.length > 0 ? Math.round((focoComBairros / foco.length) * 100) : 0;
  const pessoasFoco = foco.reduce((acc, m) => acc + m.pessoas_count, 0);
  const gapsCriticos = foco.filter((m) => m.bairros_count === 0).length;

  if (isLoading) {
    return <div className="h-32 rounded-lg bg-muted/30 animate-pulse" />;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary font-semibold">
              <Target className="h-3.5 w-3.5" />
              Microrregião de foco · {foco.length} municípios
            </div>
            <h2 className="text-2xl font-bold mt-1">Comando Territorial</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Visão executiva da cobertura estratégica da campanha
            </p>
          </div>
          <div className="flex items-center gap-2 text-right">
            <div className={`text-3xl font-bold ${cobertura >= 70 ? "text-emerald-600" : cobertura >= 40 ? "text-amber-600" : "text-rose-600"}`}>
              {cobertura}%
            </div>
            <div className="text-xs text-muted-foreground leading-tight">
              cobertura<br />de bairros
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{focoComBairros} de {foco.length} municípios mapeados</span>
            <span className="font-medium">Meta 70%</span>
          </div>
          <Progress value={cobertura} className="h-2" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI
            icon={Users}
            label="Eleitorado total no foco"
            value={eleitoradoFoco > 0 ? eleitoradoFoco.toLocaleString("pt-BR") : "—"}
            sub={populacaoFoco > 0 ? `${populacaoFoco.toLocaleString("pt-BR")} habitantes` : "Importe dados IBGE"}
          />
          <KPI
            icon={Map}
            label="Municípios prioritários"
            value={foco.length.toString()}
            sub={`${municipios.length - foco.length} fora do foco`}
          />
          <KPI
            icon={TrendingUp}
            label="Pessoas cadastradas no foco"
            value={pessoasFoco.toLocaleString("pt-BR")}
            sub={pessoasFoco === 0 ? "Comece pelo CRM" : "via endereços vinculados"}
          />
          <KPI
            icon={AlertTriangle}
            label="Gaps críticos"
            value={gapsCriticos.toString()}
            sub={gapsCriticos === 0 ? "Tudo coberto ✓" : "municípios sem bairros"}
            danger={gapsCriticos > 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function KPI({ icon: Icon, label, value, sub, danger }: any) {
  return (
    <div className="rounded-lg bg-card border p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={`text-xl font-bold ${danger ? "text-rose-600" : ""}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</div>
    </div>
  );
}
