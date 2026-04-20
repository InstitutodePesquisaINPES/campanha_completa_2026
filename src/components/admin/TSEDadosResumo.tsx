import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const ANOS = [2024, 2022, 2020, 2018, 2016];

type LinhaMunicipio = {
  municipio: string;
  eleitores: number;
  registros_perfil: number;
  candidatos_perfil: number;
};

export function TSEDadosResumo() {
  const [ano, setAno] = useState(2024);
  const [uf, setUf] = useState("BA");
  const [loading, setLoading] = useState(false);
  const [linhas, setLinhas] = useState<LinhaMunicipio[]>([]);
  const [totais, setTotais] = useState({ municipios: 0, eleitores: 0, candidatos: 0 });

  const carregar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("tse_resumo_municipios" as any, { _ano: ano, _uf: uf });
      if (error) throw error;
      const arr: LinhaMunicipio[] = (data ?? []).map((r: any) => ({
        municipio: r.municipio ?? "—",
        eleitores: Number(r.eleitores ?? 0),
        registros_perfil: Number(r.registros_perfil ?? 0),
        candidatos_perfil: Number(r.candidatos_perfil ?? 0),
      }));
      setLinhas(arr);
      setTotais({
        municipios: arr.filter((x) => x.eleitores > 0 || x.candidatos_perfil > 0).length,
        eleitores: arr.reduce((s, x) => s + x.eleitores, 0),
        candidatos: arr.reduce((s, x) => s + x.candidatos_perfil, 0),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [ano, uf]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" /> Dados TSE já importados
        </CardTitle>
        <CardDescription>
          Resumo do que o sistema já possui por município ({uf} · {ano}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label className="mb-2 block">Ano</Label>
            <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ANOS.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">UF</Label>
            <Select value={uf} onValueChange={setUf}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-64">
                {UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={carregar} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Atualizar
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Municípios com dados</div>
            <div className="text-2xl font-bold">{totais.municipios.toLocaleString("pt-BR")}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Total de eleitores (perfil)</div>
            <div className="text-2xl font-bold">{totais.eleitores.toLocaleString("pt-BR")}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Registros candidato×perfil</div>
            <div className="text-2xl font-bold">{totais.candidatos.toLocaleString("pt-BR")}</div>
          </div>
        </div>

        <div className="rounded-lg border max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr className="text-left">
                <th className="p-2">Município</th>
                <th className="p-2 text-right">Eleitores</th>
                <th className="p-2 text-right">Linhas perfil</th>
                <th className="p-2 text-right">Cand×perfil</th>
                <th className="p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 && !loading && (
                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">
                  Nenhum dado importado para {uf}·{ano}.
                </td></tr>
              )}
              {linhas.map((l) => {
                const temEleit = l.eleitores > 0;
                const temCand = l.candidatos_perfil > 0;
                return (
                  <tr key={l.municipio} className="border-t">
                    <td className="p-2 font-medium">{l.municipio}</td>
                    <td className="p-2 text-right">{l.eleitores.toLocaleString("pt-BR")}</td>
                    <td className="p-2 text-right">{l.registros_perfil.toLocaleString("pt-BR")}</td>
                    <td className="p-2 text-right">{l.candidatos_perfil.toLocaleString("pt-BR")}</td>
                    <td className="p-2 text-center">
                      {temEleit && temCand ? (
                        <Badge>Completo</Badge>
                      ) : temEleit || temCand ? (
                        <Badge variant="secondary">Parcial</Badge>
                      ) : (
                        <Badge variant="outline">Vazio</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
