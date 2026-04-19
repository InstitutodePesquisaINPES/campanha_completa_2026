import { useState } from "react";
import { useVereadoresHistoricos, useVereadorStats, usePopularVereadores, useUpdateVereador, FAIXA_LABEL, type FaixaVotos, type VereadorAlinhamento } from "@/hooks/useInteligenciaPolitica";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Vote, Trophy, Search, Download, Users, RefreshCw } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

const FAIXA_COLOR: Record<FaixaVotos, string> = {
  ate_150: "hsl(var(--muted-foreground))",
  f_150_500: "hsl(var(--info))",
  f_500_1000: "hsl(var(--primary))",
  f_1000_2000: "hsl(var(--warning))",
  f_2000_5000: "hsl(var(--success))",
  acima_5000: "hsl(var(--destructive))",
};

const ALINH_COLOR: Record<VereadorAlinhamento, string> = {
  aliado: "bg-success/15 text-success border-success/40",
  simpatizante: "bg-info/15 text-info border-info/40",
  neutro: "bg-muted text-muted-foreground border-border",
  adversario: "bg-destructive/15 text-destructive border-destructive/40",
  desconhecido: "bg-muted/50 text-muted-foreground border-muted",
};

export function VereadoresHistoricosTab() {
  const [filters, setFilters] = useState<any>({ uf: "BA", ano: 2024 });
  const [busca, setBusca] = useState("");
  const { data: vereadores = [], isLoading } = useVereadoresHistoricos(filters);
  const { data: stats } = useVereadorStats(filters.uf, filters.ano);
  const popular = usePopularVereadores();
  const update = useUpdateVereador();

  const filtered = vereadores.filter((v: any) =>
    !busca || v.nome_completo.toLowerCase().includes(busca.toLowerCase()) || v.nome_urna?.toLowerCase().includes(busca.toLowerCase())
  );

  const chartData = stats ? Object.entries(stats.porFaixa).map(([faixa, count]) => ({
    faixa: FAIXA_LABEL[faixa as FaixaVotos] ?? faixa,
    count,
    color: FAIXA_COLOR[faixa as FaixaVotos] ?? "hsl(var(--primary))",
  })) : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4"><Vote className="h-4 w-4 text-primary mb-1" /><div className="text-2xl font-bold">{stats?.total ?? 0}</div><p className="text-xs text-muted-foreground">Vereadores</p></CardContent></Card>
        <Card><CardContent className="p-4"><Trophy className="h-4 w-4 text-success mb-1" /><div className="text-2xl font-bold text-success">{stats?.eleitos ?? 0}</div><p className="text-xs text-muted-foreground">Eleitos</p></CardContent></Card>
        <Card><CardContent className="p-4"><Users className="h-4 w-4 text-info mb-1" /><div className="text-2xl font-bold">{(stats?.totalVotos ?? 0).toLocaleString()}</div><p className="text-xs text-muted-foreground">Votos totais</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-success">{stats?.porAlinhamento.aliado ?? 0}</div><p className="text-xs text-muted-foreground">Aliados</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-destructive">{stats?.porAlinhamento.adversario ?? 0}</div><p className="text-xs text-muted-foreground">Adversários</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição por faixa de votos</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="faixa" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">Sem dados. Importe os vereadores primeiro.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Importar do TSE</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Lê <code>tse_candidatos</code> e classifica vereadores com mais de 150 votos.</p>
            <Button onClick={() => popular.mutate({ uf: filters.uf, ano: filters.ano, votosMin: 150 })} disabled={popular.isPending} className="w-full">
              <RefreshCw className={`h-4 w-4 mr-2 ${popular.isPending ? "animate-spin" : ""}`} />
              {popular.isPending ? "Importando..." : `Importar ${filters.uf}/${filters.ano}`}
            </Button>
            <p className="text-[10px] text-muted-foreground">Idempotente — reexecutar atualiza os dados.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle className="text-base">Candidatos a vereador</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome..." className="pl-7 h-8 w-48" />
              </div>
              <Select value={filters.uf} onValueChange={(v) => setFilters({ ...filters, uf: v })}>
                <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="BA">BA</SelectItem></SelectContent>
              </Select>
              <Select value={String(filters.ano)} onValueChange={(v) => setFilters({ ...filters, ano: Number(v) })}>
                <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="2024">2024</SelectItem><SelectItem value="2020">2020</SelectItem></SelectContent>
              </Select>
              <Select value={filters.faixa ?? "all"} onValueChange={(v) => setFilters({ ...filters, faixa: v === "all" ? undefined : v })}>
                <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Faixa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas faixas</SelectItem>
                  {Object.entries(FAIXA_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.alinhamento ?? "all"} onValueChange={(v) => setFilters({ ...filters, alinhamento: v === "all" ? undefined : v })}>
                <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Alinhamento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="aliado">Aliado</SelectItem>
                  <SelectItem value="simpatizante">Simpatizante</SelectItem>
                  <SelectItem value="neutro">Neutro</SelectItem>
                  <SelectItem value="adversario">Adversário</SelectItem>
                  <SelectItem value="desconhecido">Desconhecido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>Partido</TableHead>
                  <TableHead className="text-right">Votos</TableHead>
                  <TableHead>Faixa</TableHead>
                  <TableHead>Eleito</TableHead>
                  <TableHead>Alinhamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 200).map((v: any, idx: number) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{v.nome_urna ?? v.nome_completo}</p>
                        <p className="text-[10px] text-muted-foreground">{v.nome_completo}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{v.municipio?.nome ?? v.cod_municipio_tse}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{v.partido_sigla} {v.numero_urna && `· ${v.numero_urna}`}</Badge></TableCell>
                    <TableCell className="text-right font-mono font-medium">{v.votos_recebidos.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]" style={{ borderColor: FAIXA_COLOR[v.faixa_votos as FaixaVotos], color: FAIXA_COLOR[v.faixa_votos as FaixaVotos] }}>{FAIXA_LABEL[v.faixa_votos as FaixaVotos]}</Badge></TableCell>
                    <TableCell>{v.eleito ? <Badge className="bg-success text-success-foreground text-[10px]">Sim</Badge> : <span className="text-xs text-muted-foreground">Não</span>}</TableCell>
                    <TableCell>
                      <Select value={v.alinhamento ?? "desconhecido"} onValueChange={(val) => update.mutate({ id: v.id, alinhamento: val })}>
                        <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aliado">Aliado</SelectItem>
                          <SelectItem value="simpatizante">Simpatizante</SelectItem>
                          <SelectItem value="neutro">Neutro</SelectItem>
                          <SelectItem value="adversario">Adversário</SelectItem>
                          <SelectItem value="desconhecido">Desconhecido</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum vereador encontrado. Use "Importar do TSE" acima.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {filtered.length > 200 && (
            <p className="text-xs text-muted-foreground text-center pt-2">Mostrando 200 de {filtered.length}. Use filtros para refinar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
