import { useState } from "react";
import { useTSEOrigemVotosLocal, useVotosPorSecao } from "@/hooks/useEleitoralTSE";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin } from "lucide-react";

export function OrigemVotosTab({ uf, ano, cargo, codMunicipio }: { uf: string; ano: number; cargo?: string; codMunicipio?: string }) {
  const [numero, setNumero] = useState("");
  const filters = codMunicipio ? { ano, uf, cod_municipio_tse: codMunicipio, cargo, numero_votavel: numero || undefined } : null;
  const { data: rows = [], isLoading } = useVotosPorSecao(filters);
  const { data: locais = [], isLoading: loadingLocais } = useTSEOrigemVotosLocal(filters);

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

      <Tabs defaultValue="local">
        <TabsList>
          <TabsTrigger value="local">Por local de votação ({locais.length})</TabsTrigger>
          <TabsTrigger value="secao">Por zona/seção</TabsTrigger>
        </TabsList>

        <TabsContent value="local" className="mt-3">
          {loadingLocais ? <Skeleton className="h-96" /> : locais.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Sem locais de votação cadastrados para este município.</CardContent></Card>
          ) : (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Ranking de locais por votos recebidos</CardTitle></CardHeader>
              <CardContent>
                <div className="max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Zona</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Bairro / Endereço</TableHead>
                        <TableHead className="text-right">Seções</TableHead>
                        <TableHead className="text-right">Votos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locais.map((l: any) => (
                        <TableRow key={`${l.zona}-${l.codigo_local}`}>
                          <TableCell className="font-mono text-xs">{l.zona}</TableCell>
                          <TableCell className="text-xs">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground shrink-0" />{l.nome_local ?? "—"}</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{l.bairro ?? "—"}{l.endereco ? ` · ${l.endereco}` : ""}</TableCell>
                          <TableCell className="text-right font-mono text-xs tabular-nums">{l.total_secoes}</TableCell>
                          <TableCell className="text-right font-mono font-medium tabular-nums">{(l.total_votos ?? 0).toLocaleString("pt-BR")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="secao" className="mt-3">
          {isLoading ? <Skeleton className="h-96" /> : rows.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Sem dados de seção para este filtro. Importe <code>tse_resultados_secao</code>.</CardContent></Card>
          ) : (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Detalhamento por seção</CardTitle></CardHeader>
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
                            {r.local_nome ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground shrink-0" />{r.local_nome}</span> : <span className="text-muted-foreground">—</span>}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
