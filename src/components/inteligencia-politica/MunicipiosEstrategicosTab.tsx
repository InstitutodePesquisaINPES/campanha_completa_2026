import { useState } from "react";
import { useMunicipiosEstrategicos, useUpsertMunicipioEstrategico, useDeleteMunicipioEstrategico, CLASS_COLOR, CLASS_LABEL, type ClassificacaoEstrategica } from "@/hooks/useInteligenciaPolitica";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Target, TrendingUp, AlertTriangle, MapPin } from "lucide-react";

export function MunicipiosEstrategicosTab({ campanhaId }: { campanhaId: string }) {
  const { data: rows = [], isLoading } = useMunicipiosEstrategicos(campanhaId);
  const upsert = useUpsertMunicipioEstrategico();
  const del = useDeleteMunicipioEstrategico();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: municipios = [] } = useQuery({
    queryKey: ["municipios-list"],
    queryFn: async () => {
      const { data } = await supabase.from("municipios").select("id, nome").order("nome").limit(500);
      return data ?? [];
    },
  });

  const stats = {
    total: rows.length,
    redutos: rows.filter((r: any) => r.classificacao === "reduto").length,
    disputa: rows.filter((r: any) => r.classificacao === "disputa").length,
    expansao: rows.filter((r: any) => r.classificacao === "expansao").length,
    metaTotal: rows.reduce((a: number, b: any) => a + (b.meta_votos ?? 0), 0),
  };

  function startNew() {
    setEditing({ campanha_id: campanhaId, municipio_id: "", classificacao: "neutro", score: 50, meta_votos: 0, prioridade: 3 });
    setOpen(true);
  }

  function startEdit(row: any) {
    setEditing({ ...row });
    setOpen(true);
  }

  async function save() {
    if (!editing.municipio_id) return;
    await upsert.mutateAsync(editing);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4"><MapPin className="h-4 w-4 text-primary mb-1" /><div className="text-2xl font-bold">{stats.total}</div><p className="text-xs text-muted-foreground">Municípios</p></CardContent></Card>
        <Card><CardContent className="p-4"><Target className="h-4 w-4 text-success mb-1" /><div className="text-2xl font-bold text-success">{stats.redutos}</div><p className="text-xs text-muted-foreground">Redutos</p></CardContent></Card>
        <Card><CardContent className="p-4"><AlertTriangle className="h-4 w-4 text-warning mb-1" /><div className="text-2xl font-bold text-warning">{stats.disputa}</div><p className="text-xs text-muted-foreground">Em Disputa</p></CardContent></Card>
        <Card><CardContent className="p-4"><TrendingUp className="h-4 w-4 text-info mb-1" /><div className="text-2xl font-bold text-info">{stats.expansao}</div><p className="text-xs text-muted-foreground">Expansão</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.metaTotal.toLocaleString()}</div><p className="text-xs text-muted-foreground">Meta total de votos</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Municípios estratégicos</CardTitle>
            <Button size="sm" onClick={startNew}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Município</TableHead>
                  <TableHead>Classificação</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Meta de votos</TableHead>
                  <TableHead className="text-right">Histórico</TableHead>
                  <TableHead className="text-right">Prioridade</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.municipio?.nome ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={CLASS_COLOR[r.classificacao as ClassificacaoEstrategica]}>{CLASS_LABEL[r.classificacao as ClassificacaoEstrategica]}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{Number(r.score).toFixed(1)}</TableCell>
                    <TableCell className="text-right font-medium">{(r.meta_votos ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{(r.votos_historicos ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{"⭐".repeat(Math.max(1, 6 - r.prioridade))}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(r)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum município mapeado. Adicione o primeiro.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Novo"} município estratégico</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Município</Label>
                <Select value={editing.municipio_id} onValueChange={(v) => setEditing({ ...editing, municipio_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {municipios.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Classificação</Label>
                <Select value={editing.classificacao} onValueChange={(v) => setEditing({ ...editing, classificacao: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CLASS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade (1=mais alta)</Label>
                <Input type="number" min={1} max={5} value={editing.prioridade} onChange={(e) => setEditing({ ...editing, prioridade: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Score (0-100)</Label>
                <Input type="number" min={0} max={100} value={editing.score} onChange={(e) => setEditing({ ...editing, score: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Meta de votos</Label>
                <Input type="number" min={0} value={editing.meta_votos} onChange={(e) => setEditing({ ...editing, meta_votos: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Votos históricos</Label>
                <Input type="number" min={0} value={editing.votos_historicos ?? 0} onChange={(e) => setEditing({ ...editing, votos_historicos: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Potencial</Label>
                <Input type="number" min={0} value={editing.potencial_votos ?? 0} onChange={(e) => setEditing({ ...editing, potencial_votos: Number(e.target.value) })} />
              </div>
              <div className="col-span-2">
                <Label>Observações</Label>
                <Textarea value={editing.observacoes ?? ""} onChange={(e) => setEditing({ ...editing, observacoes: e.target.value })} />
              </div>
              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={upsert.isPending}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
