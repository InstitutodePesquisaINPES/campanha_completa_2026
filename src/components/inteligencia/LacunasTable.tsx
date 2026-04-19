import { useLacunasTerritoriais } from "@/hooks/useInteligenciaTerritorial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, AlertTriangle } from "lucide-react";

function scoreBadge(score: number) {
  if (score >= 60) return <Badge variant="destructive">Crítica</Badge>;
  if (score >= 35) return <Badge className="bg-orange-500 hover:bg-orange-500/90">Alta</Badge>;
  if (score >= 15) return <Badge variant="secondary">Média</Badge>;
  return <Badge variant="outline">Baixa</Badge>;
}

export function LacunasTable() {
  const { data = [], isLoading } = useLacunasTerritoriais();
  const top = data.slice(0, 30);
  const criticos = data.filter((d) => d.score_prioridade >= 60).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Top 30 Bairros por Prioridade
        </CardTitle>
        {criticos > 0 && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {criticos} bairros em situação crítica de cobertura
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bairro</TableHead>
              <TableHead>Município</TableHead>
              <TableHead className="text-right">Apoiadores</TableHead>
              <TableHead className="text-right">Eventos</TableHead>
              <TableHead className="text-right">Demandas</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead>Prioridade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : top.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Sem dados territoriais.</TableCell></TableRow>
            ) : top.map((b) => (
              <TableRow key={b.bairro_id}>
                <TableCell className="font-medium">{b.bairro_nome}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{b.municipio_nome}</TableCell>
                <TableCell className="text-right font-mono text-xs">{b.total_pessoas}</TableCell>
                <TableCell className="text-right font-mono text-xs">{b.total_eventos}</TableCell>
                <TableCell className="text-right font-mono text-xs">{b.demandas_abertas}</TableCell>
                <TableCell className="text-right font-mono text-xs font-semibold">{b.score_prioridade}</TableCell>
                <TableCell>{scoreBadge(b.score_prioridade)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
