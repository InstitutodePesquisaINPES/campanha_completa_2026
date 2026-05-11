import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, MapPin } from "lucide-react";
import { fetchEstados, fetchMunicipiosByUF } from "@/lib/api/ibge";
import { toast } from "sonner";

export function TerritoriosAdminTab() {
  const qc = useQueryClient();
  const [uf, setUf] = useState<string>("");

  const { data: estados = [] } = useQuery({
    queryKey: ["ibge-estados"],
    queryFn: fetchEstados,
  });

  const { data: counts } = useQuery({
    queryKey: ["territorio-counts"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/territorio/stats");
        return data || { estados: 0, municipios: 0, bairros: 0 };
      } catch {
        return { estados: 0, municipios: 0, bairros: 0 };
      }
    },
  });

  const importMunicipios = useMutation({
    mutationFn: async () => {
      if (!uf) throw new Error("Selecione um estado");
      const estado = estados.find((e) => e.sigla === uf);
      if (!estado) throw new Error("Estado não encontrado");

      const municipios = await fetchMunicipiosByUF(uf);
      const data = await api.post<any>("/territorio/importar-ibge", {
        uf,
        estado_nome: estado.nome,
        geocodigo_ibge: String(estado.id),
        municipios: municipios.map((m) => ({
          nome: m.nome,
          geocodigo_ibge: String(m.id),
        })),
      });
      return data?.count ?? municipios.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["territorio-counts"] });
      toast.success(`${n} municípios importados/atualizados`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Estados</div><div className="text-2xl font-bold">{counts?.estados ?? 0}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Municípios</div><div className="text-2xl font-bold">{counts?.municipios ?? 0}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Bairros</div><div className="text-2xl font-bold">{counts?.bairros ?? 0}</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Importar Municípios do IBGE</CardTitle>
          <CardDescription>Selecione um estado e importe todos os municípios (não duplica).</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-3 flex-wrap">
          <div className="min-w-[200px]">
            <Select value={uf} onValueChange={setUf}>
              <SelectTrigger><SelectValue placeholder="Selecione UF" /></SelectTrigger>
              <SelectContent>
                {estados.map((e) => <SelectItem key={e.sigla} value={e.sigla}>{e.sigla} — {e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => importMunicipios.mutate()} disabled={!uf || importMunicipios.isPending}>
            {importMunicipios.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
            Importar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
