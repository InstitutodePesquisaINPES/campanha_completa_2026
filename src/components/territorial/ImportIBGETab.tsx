import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Globe } from "lucide-react";
import { fetchEstados, fetchMunicipiosByUF } from "@/lib/api/ibge";
import { toast } from "sonner";

export function ImportIBGETab() {
  const qc = useQueryClient();
  const [uf, setUf] = useState<string>("");

  const { data: estados = [] } = useQuery({
    queryKey: ["ibge-estados"],
    queryFn: fetchEstados,
  });

  const importMunicipios = useMutation({
    mutationFn: async () => {
      if (!uf) throw new Error("Selecione um estado");
      const estado = estados.find((e) => e.sigla === uf);
      if (!estado) throw new Error("Estado não encontrado");

      const { data: dbEstado } = await supabase
        .from("estados").select("id").eq("sigla", uf).maybeSingle();

      let estadoId = dbEstado?.id;
      if (!estadoId) {
        const { data: ins, error } = await supabase
          .from("estados")
          .insert({ sigla: uf, nome: estado.nome, geocodigo_ibge: String(estado.id) })
          .select("id").single();
        if (error) throw error;
        estadoId = ins.id;
      }

      const municipios = await fetchMunicipiosByUF(uf);
      const rows = municipios.map((m) => ({
        nome: m.nome,
        estado_id: estadoId!,
        geocodigo_ibge: String(m.id),
      }));
      const { error: upErr } = await supabase
        .from("municipios")
        .upsert(rows, { onConflict: "geocodigo_ibge", ignoreDuplicates: true });
      if (upErr) throw upErr;
      return rows.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["municipios"] });
      qc.invalidateQueries({ queryKey: ["territorio-stats"] });
      toast.success(`${n} municípios importados/atualizados`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Importar do IBGE
        </CardTitle>
        <CardDescription>
          Baixa todos os municípios oficiais do IBGE para o estado selecionado. Não duplica registros existentes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-end gap-3 flex-wrap">
        <div className="min-w-[260px]">
          <Select value={uf} onValueChange={setUf}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado (UF)" />
            </SelectTrigger>
            <SelectContent>
              {estados.map((e) => (
                <SelectItem key={e.sigla} value={e.sigla}>
                  {e.sigla} — {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => importMunicipios.mutate()} disabled={!uf || importMunicipios.isPending}>
          {importMunicipios.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1" />
          )}
          Importar municípios
        </Button>
      </CardContent>
    </Card>
  );
}
