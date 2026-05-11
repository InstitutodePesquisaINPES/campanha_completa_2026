import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { useDemografiaMunicipio, useTopMunicipios } from "@/hooks/useDemografia";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, TrendingUp, Building2, Trees } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS_GENDER = { M: "hsl(var(--primary))", F: "hsl(var(--accent))" };

export function DemografiaTab() {
  const [municipioId, setMunicipioId] = useState<string>("");
  const [metric, setMetric] = useState<"populacao_2022" | "densidade_hab_km2" | "idh">("populacao_2022");

  const { data: municipios = [] } = useQuery({
    queryKey: ["municipios-demografia-list"],
    queryFn: async () => {
      const data = await api.get<any[]>("/territorio/municipios?fields=id,nome,populacao_2022,area_km2,idh,urbano_pct,densidade_hab_km2");
      return (data || []) as Array<{
        id: string; nome: string;
        populacao_2022: number | null; area_km2: number | null;
        idh: number | null; urbano_pct: number | null; densidade_hab_km2: number | null;
      }>;
    },
  });

  const { data: piramide = [], isLoading: loadingPiramide } = useDemografiaMunicipio(municipioId);
  const { data: top = [], isLoading: loadingTop } = useTopMunicipios(metric, 10);

  const piramideData = useMemo(() => {
    const map = new Map<string, { faixa: string; M: number; F: number; ordem: number }>();
    for (const r of piramide) {
      if (r.sexo === "T") continue;
      const key = r.faixa_etaria;
      const cur = map.get(key) || { faixa: key, M: 0, F: 0, ordem: r.faixa_min };
      if (r.sexo === "M") cur.M = -r.quantidade; else cur.F = r.quantidade;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.ordem - b.ordem);
  }, [piramide]);

  const muniSel = municipios.find((m) => m.id === municipioId);
  const totalPop = useMemo(() => municipios.reduce((s, m) => s + (m.populacao_2022 || 0), 0), [municipios]);
  const totalUrbano = useMemo(() => {
    let urb = 0, rur = 0;
    for (const m of municipios) {
      const p = m.populacao_2022 || 0;
      const pct = (m.urbano_pct ?? 0) / 100;
      urb += p * pct;
      rur += p * (1 - pct);
    }
    return [
      { name: "Urbano", value: Math.round(urb) },
      { name: "Rural", value: Math.round(rur) },
    ];
  }, [municipios]);

  return (
    <div className="space-y-4">
      {/* KPIs gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> População BA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPop.toLocaleString("pt-BR")}</div>
            <div className="text-xs text-muted-foreground">{municipios.length} municípios</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Urbano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUrbano[0].value.toLocaleString("pt-BR")}</div>
            <div className="text-xs text-muted-foreground">
              {totalPop > 0 ? ((totalUrbano[0].value / totalPop) * 100).toFixed(1) : "0"}% da população
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><Trees className="h-3.5 w-3.5" /> Rural</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUrbano[1].value.toLocaleString("pt-BR")}</div>
            <div className="text-xs text-muted-foreground">
              {totalPop > 0 ? ((totalUrbano[1].value / totalPop) * 100).toFixed(1) : "0"}% da população
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> IDH médio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(municipios.filter((m) => m.idh).reduce((s, m) => s + (m.idh || 0), 0) /
                Math.max(1, municipios.filter((m) => m.idh).length)).toFixed(3)}
            </div>
            <div className="text-xs text-muted-foreground">{municipios.filter((m) => m.idh).length} municípios c/ dados</div>
          </CardContent>
        </Card>
      </div>

      {/* Top municípios + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Top 10 municípios</CardTitle>
                <CardDescription>Ranking por indicador selecionado</CardDescription>
              </div>
              <Select value={metric} onValueChange={(v: any) => setMetric(v)}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="populacao_2022">População (Censo 2022)</SelectItem>
                  <SelectItem value="densidade_hab_km2">Densidade (hab/km²)</SelectItem>
                  <SelectItem value="idh">IDH-M</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTop ? (
              <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={top} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="nome" type="category" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey={metric} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Urbano × Rural</CardTitle>
            <CardDescription>Distribuição estadual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={totalUrbano} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--accent))" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pirâmide etária */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>Pirâmide etária por município</CardTitle>
              <CardDescription>Distribuição por faixa etária e sexo (Censo 2022)</CardDescription>
            </div>
            <Select value={municipioId} onValueChange={setMunicipioId}>
              <SelectTrigger className="w-[260px]"><SelectValue placeholder="Selecione um município" /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {municipios.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {muniSel && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">Pop: {(muniSel.populacao_2022 || 0).toLocaleString("pt-BR")}</Badge>
              {muniSel.area_km2 && <Badge variant="secondary">Área: {muniSel.area_km2.toLocaleString("pt-BR")} km²</Badge>}
              {muniSel.densidade_hab_km2 && <Badge variant="secondary">Densidade: {muniSel.densidade_hab_km2.toFixed(1)} hab/km²</Badge>}
              {muniSel.idh && <Badge variant="secondary">IDH: {muniSel.idh.toFixed(3)}</Badge>}
              {muniSel.urbano_pct != null && <Badge variant="secondary">Urbano: {muniSel.urbano_pct.toFixed(1)}%</Badge>}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!municipioId ? (
            <div className="text-center text-muted-foreground py-12">Selecione um município para ver a pirâmide etária.</div>
          ) : loadingPiramide ? (
            <div className="flex items-center justify-center h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : piramideData.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              Sem dados demográficos para este município. Use o painel Admin → IBGE para importar.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={piramideData} layout="vertical" stackOffset="sign" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={(v) => Math.abs(v).toLocaleString("pt-BR")} tick={{ fontSize: 11 }} />
                <YAxis dataKey="faixa" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip formatter={(v: number) => Math.abs(v).toLocaleString("pt-BR")} />
                <Legend />
                <Bar dataKey="M" name="Homens" fill={COLORS_GENDER.M} stackId="stack" />
                <Bar dataKey="F" name="Mulheres" fill={COLORS_GENDER.F} stackId="stack" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
