import { useState } from "react";
import { useTSECandidatos } from "@/hooks/useEleitoralTSE";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Trophy } from "lucide-react";
import { CandidatoDrawer360 } from "./CandidatoDrawer360";

export function CandidatosTab({ uf, ano, cargo, codMunicipio }: { uf: string; ano: number; cargo?: string; codMunicipio?: string }) {
  const [busca, setBusca] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const { data: candidatos = [], isLoading } = useTSECandidatos({ uf, ano, cargo, cod_municipio_tse: codMunicipio, busca: busca || undefined });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Candidatos · {uf} {ano} {cargo ? `· ${cargo}` : ""}</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome..." className="pl-7 h-9 w-64" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : candidatos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Nenhum candidato encontrado para os filtros selecionados.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Partido</TableHead>
                    <TableHead className="text-right">Votos</TableHead>
                    <TableHead className="w-16">Eleito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidatos.slice(0, 300).map((c: any, idx: number) => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/60" onClick={() => setSelected(c)}>
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{c.nome_urna ?? c.nome_completo}</p>
                          <p className="text-[10px] text-muted-foreground">{c.nome_completo}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{c.cargo}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{c.partido_sigla} {c.numero_urna && `· ${c.numero_urna}`}</Badge></TableCell>
                      <TableCell className="text-right font-mono font-medium tabular-nums">{(c.votos_recebidos ?? 0).toLocaleString("pt-BR")}</TableCell>
                      <TableCell>{c.eleito ? <Trophy className="h-4 w-4 text-success" /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {candidatos.length > 300 && (
              <p className="text-[11px] text-muted-foreground text-center pt-2">
                Mostrando 300 de {candidatos.length}. Refine os filtros para ver mais.
              </p>
            )}
          </>
        )}
      </CardContent>
      <CandidatoDrawer360 candidato={selected} onClose={() => setSelected(null)} />
    </Card>
  );
}
