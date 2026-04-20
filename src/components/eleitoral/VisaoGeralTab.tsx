import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Vote, Trophy, MapPin, FileText, Building2, UserCheck } from "lucide-react";
import { useTSEKpis, useTSEMunicipioResumo } from "@/hooks/useEleitoralTSE";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function KPI({ icon: Icon, label, value, color = "primary" }: any) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-default">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg bg-${color}/10 text-${color} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function VisaoGeralTab({ uf, ano, onPickMunicipio }: { uf: string; ano: number; onPickMunicipio: (cod: string, nome: string) => void }) {
  const { data: kpis, isLoading } = useTSEKpis(uf, ano);
  const { data: municipios = [] } = useTSEMunicipioResumo(uf, ano);

  const fmt = (n: number) => (n ?? 0).toLocaleString("pt-BR");
  const top10 = municipios.slice(0, 10).map((m: any) => ({ ...m, label: m.municipio?.slice(0, 18) ?? m.cod_municipio_tse }));

  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Users} label="Eleitores" value={fmt(kpis?.total_eleitores)} />
        <KPI icon={Building2} label="Municípios" value={fmt(kpis?.total_municipios)} color="info" />
        <KPI icon={Vote} label="Candidatos" value={fmt(kpis?.total_candidatos)} color="warning" />
        <KPI icon={Trophy} label="Eleitos" value={fmt(kpis?.total_eleitos)} color="success" />
        <KPI icon={FileText} label="Votos nominais" value={fmt(kpis?.total_votos_nominais)} />
        <KPI icon={MapPin} label="Locais de votação" value={fmt(kpis?.total_locais_votacao)} color="info" />
        <KPI icon={UserCheck} label="Pessoas no CRM com candidatura" value={fmt(kpis?.pessoas_crm_candidatas)} color="success" />
        <KPI icon={Users} label="Comp. médio" value={kpis?.total_municipios ? Math.round((kpis.total_eleitores ?? 0) / kpis.total_municipios).toLocaleString("pt-BR") : "–"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Top 10 municípios por eleitorado · {uf}/{ano}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={top10} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR")} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="total_eleitores" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Top municípios — candidatos eleitos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-80 overflow-auto">
              {municipios.slice(0, 25).map((m: any) => (
                <button
                  key={m.cod_municipio_tse}
                  onClick={() => onPickMunicipio(m.cod_municipio_tse, m.municipio)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-left hover:bg-muted/60 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.municipio ?? m.cod_municipio_tse}</p>
                    <p className="text-[10px] text-muted-foreground">{fmt(m.total_eleitores)} eleitores</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="text-muted-foreground">{m.total_candidatos} cand.</span>
                    <span className="font-bold text-success">{m.total_eleitos} ✓</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
