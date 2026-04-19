import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCampanhas } from "@/hooks/useCampanhas";
import { useMunicipiosEstrategicos, useLiderancaStats, useVereadorStats, FAIXA_LABEL, CLASS_LABEL, CLASS_COLOR, type FaixaVotos, type ClassificacaoEstrategica } from "@/hooks/useInteligenciaPolitica";
import { Target, Users, Vote, MapPin, TrendingUp, Crown, Building2, Heart } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function PlanoEstrategicoPage() {
  const { data: campanhas = [] } = useCampanhas();
  const [campanhaId, setCampanhaId] = useState<string>("");
  if (!campanhaId && campanhas.length > 0) setCampanhaId(campanhas[0].id);
  const campanha = campanhas.find((c: any) => c.id === campanhaId);

  const { data: municipios = [] } = useMunicipiosEstrategicos(campanhaId);
  const { data: liderStats } = useLiderancaStats(campanhaId);
  const { data: verStats } = useVereadorStats("BA", 2024);

  const classData = ["reduto", "disputa", "expansao", "perdido", "neutro"].map((c) => ({
    name: CLASS_LABEL[c as ClassificacaoEstrategica],
    value: municipios.filter((m: any) => m.classificacao === c).length,
    color: c === "reduto" ? "hsl(var(--success))" : c === "disputa" ? "hsl(var(--warning))" : c === "expansao" ? "hsl(var(--info))" : c === "perdido" ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))",
  })).filter(d => d.value > 0);

  const faixaData = verStats ? Object.entries(verStats.porFaixa).map(([k, v]) => ({
    faixa: FAIXA_LABEL[k as FaixaVotos] ?? k,
    count: v,
  })) : [];

  const metaTotal = municipios.reduce((a: number, b: any) => a + (b.meta_votos ?? 0), 0);
  const liderancasA = (liderStats?.porClass.A ?? 0) + (liderStats?.porClass.B ?? 0);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6 max-w-[1500px] mx-auto">
          {/* HERO */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 p-8 text-primary-foreground shadow-2xl">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold opacity-80">Plano Estratégico Executivo</p>
                <h1 className="text-4xl md:text-5xl font-extrabold mt-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {campanha?.nome ?? "Selecione uma campanha"}
                </h1>
                <p className="mt-2 text-base opacity-90">{campanha?.cargo ? `Candidato a ${campanha.cargo.replace("_", " ")}` : ""} · {campanha?.partido_sigla ?? ""}</p>
              </div>
              <Select value={campanhaId} onValueChange={setCampanhaId}>
                <SelectTrigger className="w-72 bg-background/95 text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {campanhas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* KPIs principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <Vote className="h-5 w-5 text-primary" />
                  <Badge variant="secondary" className="text-[10px]">META</Badge>
                </div>
                <p className="text-3xl font-extrabold tabular-nums">{(campanha?.meta_votos ?? metaTotal).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Votos no objetivo</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-success">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <MapPin className="h-5 w-5 text-success" />
                  <Badge variant="secondary" className="text-[10px]">TERRITÓRIO</Badge>
                </div>
                <p className="text-3xl font-extrabold tabular-nums">{municipios.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Municípios mapeados</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-info">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <Crown className="h-5 w-5 text-info" />
                  <Badge variant="secondary" className="text-[10px]">REDE</Badge>
                </div>
                <p className="text-3xl font-extrabold tabular-nums">{liderancasA}</p>
                <p className="text-xs text-muted-foreground mt-1">Lideranças A+B</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-warning">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-5 w-5 text-warning" />
                  <Badge variant="secondary" className="text-[10px]">HISTÓRICO</Badge>
                </div>
                <p className="text-3xl font-extrabold tabular-nums">{verStats?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Vereadores analisados</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Distribuição estratégica de municípios</h3>
                {classData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={classData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value" label={(e: any) => `${e.name}: ${e.value}`}>
                        {classData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-12 text-center">Configure os municípios estratégicos em Inteligência Política.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Vote className="h-4 w-4 text-primary" /> Vereadores por faixa de votos (Bahia 2024)</h3>
                {faixaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={faixaData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="faixa" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-12 text-center">Importe vereadores históricos em Inteligência Política → Vereadores.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top municípios */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4">Top 10 municípios por meta de votos</h3>
              <div className="space-y-2">
                {municipios.slice(0, 10).map((m: any, i: number) => (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.municipio?.nome ?? "—"}</p>
                      <p className="text-[10px] text-muted-foreground">Score {Number(m.score).toFixed(0)} · {m.votos_historicos?.toLocaleString() ?? 0} votos históricos</p>
                    </div>
                    <Badge variant="outline" className={CLASS_COLOR[m.classificacao as ClassificacaoEstrategica]}>{CLASS_LABEL[m.classificacao as ClassificacaoEstrategica]}</Badge>
                    <div className="text-right min-w-[100px]">
                      <p className="text-sm font-bold tabular-nums">{(m.meta_votos ?? 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">votos meta</p>
                    </div>
                  </div>
                ))}
                {municipios.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum município mapeado. Vá em Inteligência Política → Municípios.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Características das lideranças */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <Heart className="h-5 w-5 text-destructive mb-2" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Lideranças por tipo</p>
                <div className="mt-3 space-y-1.5">
                  {liderStats && Object.entries(liderStats.porTipo).slice(0, 5).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="capitalize">{k}</span>
                      <span className="font-bold">{v}</span>
                    </div>
                  ))}
                  {(!liderStats || Object.keys(liderStats.porTipo).length === 0) && <p className="text-xs text-muted-foreground">Sem dados</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <Users className="h-5 w-5 text-primary mb-2" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status das lideranças</p>
                <div className="mt-3 space-y-1.5">
                  {liderStats && Object.entries(liderStats.porStatus).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="capitalize">{k.replace("_", " ")}</span>
                      <span className="font-bold">{v}</span>
                    </div>
                  ))}
                  {(!liderStats || Object.keys(liderStats.porStatus).length === 0) && <p className="text-xs text-muted-foreground">Sem dados</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <Building2 className="h-5 w-5 text-info mb-2" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Votos potenciais (rede)</p>
                <p className="text-3xl font-extrabold mt-2 tabular-nums">{liderStats?.totalVotos.toLocaleString() ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Soma de votos estimados das lideranças mapeadas</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
