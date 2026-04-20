import { useState } from "react";
import { useVotosPorSecao } from "@/hooks/useEleitoralTSE";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin } from "lucide-react";

export function OrigemVotosTab({ uf, ano, cargo, codMunicipio }: { uf: string; ano: number; cargo?: string; codMunicipio?: string }) {
  const [numero, setNumero] = useState("");
  const { data: rows = [], isLoading } = useVotosPorSecao(
    codMunicipio ? { ano, uf, cod_municipio_tse: codMunicipio, cargo, numero_votavel: numero || undefined } : null
  );

  if (!codMunicipio) {
    return <p className="text-sm text-muted-foreground text-center py-12">Selecione um município na aba <strong>Visão Geral</strong> para drill em zona/seção.</p>;
  }

  const totalVotos = rows.reduce((s: number, r: any) => s + (r.votos ?? 0), 0);
  const zonas = new Set(rows.map((r: any) => r.zona)).size;
  const secoes = new Set(rows.map((r: any) => `${r.zona}-${r.secao}`)).size;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Filtrar por nº de candidato (opcional)" className="h-9 w-72" />
        <div className="flex gap-3 text-xs">
          <span><strong className="tabular-nums">{totalVotos.toLocaleString("pt-BR")}</strong> votos</span>
          <span><strong>{zonas}</strong> zonas</span>
          <span><strong>{secoes}</strong> seções</span>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Sem dados de seção para este filtro. Importe <code>tse_resultados_secao</code>.</CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Votos por zona/seção (com local de votação)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Zona</TableHead>
                    <TableHead className="w-16">Seção</TableHead>
                    <TableHead>Local de votação</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead className="text-right">Votos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 1000).map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{r.zona}</TableCell>
                      <TableCell className="font-mono text-xs">{r.secao}</TableCell>
                      <TableCell className="text-xs">
                        {r.local_nome ? (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground shrink-0" />{r.local_nome}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.bairro ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono font-medium tabular-nums">{(r.votos ?? 0).toLocaleString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
