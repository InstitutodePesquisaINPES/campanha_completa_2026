import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useMapaEstrategico, type SituacaoBairro } from "@/hooks/useMapaEstrategico";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Map, Search, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InteligenciaNavBar } from "@/components/inteligencia-shared/InteligenciaNavBar";
import { useCampanhas } from "@/hooks/useCampanhas";

const sitColors: Record<SituacaoBairro, string> = {
  forte: "bg-success/10 text-success border-success/30",
  medio: "bg-info/10 text-info border-info/30",
  fraco: "bg-warning/10 text-warning border-warning/30",
  critico: "bg-destructive/10 text-destructive border-destructive/30",
};
const sitLabel: Record<SituacaoBairro, string> = {
  forte: "Forte",
  medio: "Médio",
  fraco: "Fraco",
  critico: "Crítico",
};
const prioColors: Record<string, string> = {
  manter: "bg-success/10 text-success border-success/30",
  expandir: "bg-info/10 text-info border-info/30",
  atencao: "bg-warning/10 text-warning border-warning/30",
  urgente: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function MapaEstrategicoPage() {
  const [municipioId, setMunicipioId] = useState<string>("");
  const [filtro, setFiltro] = useState("");
  const { data: campanhas = [] } = useCampanhas();
  const campanhaId = campanhas[0]?.id;

  const { data: municipios = [] } = useQuery({
    queryKey: ["municipios-mapa"],
    queryFn: async () => {
      const { data } = await supabase.from("municipios").select("id, nome").order("nome").limit(500);
      return data ?? [];
    },
  });

  const { data: bairros = [], isLoading } = useMapaEstrategico(municipioId || undefined);

  const filtrados = bairros.filter((b) => !filtro || b.bairro_nome.toLowerCase().includes(filtro.toLowerCase()));

  const stats = {
    total: bairros.length,
    forte: bairros.filter((b) => b.situacao === "forte").length,
    critico: bairros.filter((b) => b.situacao === "critico").length,
    apoiadores: bairros.reduce((a, b) => a + b.apoiadores, 0),
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Map className="h-7 w-7 text-primary" />
            Mapa Estratégico de Votos
          </h1>
          <p className="text-muted-foreground mt-1">Cobertura por bairro · Situação · Ação recomendada</p>
        </div>

        <InteligenciaNavBar campanhaId={campanhaId} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.total}</div><p className="text-xs text-muted-foreground">Bairros mapeados</p></CardContent></Card>
          <Card><CardContent className="p-4"><CheckCircle2 className="h-4 w-4 text-success mb-1" /><div className="text-2xl font-bold">{stats.forte}</div><p className="text-xs text-muted-foreground">Bairros fortes</p></CardContent></Card>
          <Card><CardContent className="p-4"><AlertTriangle className="h-4 w-4 text-destructive mb-1" /><div className="text-2xl font-bold">{stats.critico}</div><p className="text-xs text-muted-foreground">Bairros críticos</p></CardContent></Card>
          <Card><CardContent className="p-4"><TrendingUp className="h-4 w-4 text-info mb-1" /><div className="text-2xl font-bold">{stats.apoiadores}</div><p className="text-xs text-muted-foreground">Apoiadores totais</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <CardTitle className="text-base">Análise estratégica</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar bairro..." className="pl-7 h-8 w-48" />
                </div>
                <Select value={municipioId || "__all__"} onValueChange={(v) => setMunicipioId(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="h-8 w-56"><SelectValue placeholder="Todos os municípios" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {municipios.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Calculando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bairro</TableHead>
                    <TableHead className="text-right">Eleitores</TableHead>
                    <TableHead className="text-right">Apoiadores</TableHead>
                    <TableHead className="text-right">Demandas</TableHead>
                    <TableHead className="text-right">Cobertura</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Ação recomendada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((b) => (
                    <TableRow key={b.bairro_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{b.bairro_nome}</p>
                          <p className="text-[10px] text-muted-foreground">{b.municipio_nome}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{b.eleitores_cadastrados}</TableCell>
                      <TableCell className="text-right text-sm">{b.apoiadores}</TableCell>
                      <TableCell className="text-right text-xs">
                        <span className="text-success">{b.demandas_resolvidas}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-warning">{b.demandas_abertas}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">{Math.round(b.cobertura_pct * 100)}%</TableCell>
                      <TableCell><Badge variant="outline" className={sitColors[b.situacao]}>{sitLabel[b.situacao]}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={`${prioColors[b.prioridade]} capitalize text-[10px]`}>{b.prioridade}</Badge>
                          <span className="text-xs text-muted-foreground truncate max-w-xs">{b.acao_recomendada}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtrados.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Nenhum bairro encontrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
