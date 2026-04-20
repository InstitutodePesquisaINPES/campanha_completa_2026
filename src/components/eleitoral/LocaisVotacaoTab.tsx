import { useLocaisVotacao } from "@/hooks/useEleitoralTSE";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Navigation } from "lucide-react";

export function LocaisVotacaoTab({ uf, ano, codMunicipio }: { uf: string; ano: number; codMunicipio?: string }) {
  const { data: locais = [], isLoading } = useLocaisVotacao(uf, ano, codMunicipio);

  if (isLoading) return <Skeleton className="h-96" />;
  if (locais.length === 0) return <p className="text-sm text-muted-foreground text-center py-12">Sem locais de votação para esses filtros.</p>;

  const comGeo = locais.filter((l: any) => l.latitude && l.longitude).length;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 text-sm">
        <Card className="flex-1"><CardContent className="p-3 text-center"><MapPin className="h-4 w-4 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{locais.length}</p><p className="text-[10px] text-muted-foreground">Locais</p></CardContent></Card>
        <Card className="flex-1"><CardContent className="p-3 text-center"><Navigation className="h-4 w-4 mx-auto text-success mb-1" /><p className="text-2xl font-bold">{comGeo}</p><p className="text-[10px] text-muted-foreground">Com geolocalização</p></CardContent></Card>
        <Card className="flex-1"><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{new Set(locais.map((l: any) => l.zona)).size}</p><p className="text-[10px] text-muted-foreground">Zonas</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Locais de votação · {uf}/{ano}</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Zona</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead className="w-20">Geo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locais.slice(0, 500).map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.zona}</TableCell>
                    <TableCell className="text-xs font-medium">{l.nome_local}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.endereco}</TableCell>
                    <TableCell className="text-xs">{l.bairro ?? "—"}</TableCell>
                    <TableCell>{l.latitude && l.longitude ? <Navigation className="h-3 w-3 text-success" /> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {locais.length > 500 && <p className="text-[11px] text-muted-foreground text-center pt-2">Mostrando 500 de {locais.length}.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
