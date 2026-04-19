import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, Plus, Pencil, TrendingUp, DollarSign } from "lucide-react";
import { usePesquisas, useUpsertPesquisa, useUpsertResultado, useCaptacao, useUpsertDoador, useDeleteDoador } from "@/hooks/usePesquisasCaptacao";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PesquisasPage() {
  const [tab, setTab] = useState("pesquisas");
  return (
    <AppLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" />Pesquisas & Captação</h1>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pesquisas"><TrendingUp className="h-4 w-4 mr-1" />Pesquisas</TabsTrigger>
            <TabsTrigger value="captacao"><DollarSign className="h-4 w-4 mr-1" />Captação</TabsTrigger>
          </TabsList>
          <TabsContent value="pesquisas" className="mt-4"><PesquisasTab /></TabsContent>
          <TabsContent value="captacao" className="mt-4"><CaptacaoTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function PesquisasTab() {
  const { data: pesquisas } = usePesquisas();
  const upsert = useUpsertPesquisa();
  const upsertRes = useUpsertResultado();
  const [dialog, setDialog] = useState<any>(null);
  const [resDialog, setResDialog] = useState<{ pesquisa_id: string; cenario: string; candidato: string; partido: string; percentual: number } | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setDialog({ tipo: "eleitoral", status: "planejada", nivel_confianca: 95 })}><Plus className="h-4 w-4 mr-1" />Nova Pesquisa</Button>
      </div>
      <div className="grid gap-3">
        {pesquisas?.map((p: any) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{p.titulo}</CardTitle>
                  <CardDescription className="text-xs">
                    {p.instituto} • {p.tipo} • amostra {p.amostra ?? "—"} • margem ±{p.margem_erro ?? "—"}%
                    {p.municipios?.nome && ` • ${p.municipios.nome}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{p.status}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => setDialog(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {p.pesquisa_resultados?.length > 0 ? (
                  <div className="space-y-1">
                    {p.pesquisa_resultados.sort((a: any, b: any) => Number(b.percentual) - Number(a.percentual)).map((r: any) => (
                      <div key={r.id} className="flex items-center gap-2 text-sm">
                        <span className="w-32 truncate">{r.candidato}</span>
                        <span className="text-xs text-muted-foreground w-16">{r.partido}</span>
                        <div className="flex-1 bg-muted rounded h-2 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${Math.min(100, Number(r.percentual))}%` }} />
                        </div>
                        <span className="font-mono text-sm w-16 text-right">{Number(r.percentual).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">Sem resultados cadastrados</p>}
                <Button size="sm" variant="outline" onClick={() => setResDialog({ pesquisa_id: p.id, cenario: "estimulada", candidato: "", partido: "", percentual: 0 })}>
                  <Plus className="h-3 w-3 mr-1" />Adicionar resultado
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!dialog} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{dialog?.id ? "Editar" : "Nova"} Pesquisa</DialogTitle></DialogHeader>
          {dialog && (
            <div className="grid gap-3">
              <div><Label>Título</Label><Input value={dialog.titulo ?? ""} onChange={e => setDialog({ ...dialog, titulo: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Instituto</Label><Input value={dialog.instituto ?? ""} onChange={e => setDialog({ ...dialog, instituto: e.target.value })} /></div>
                <div><Label>Registro TSE</Label><Input value={dialog.registro_tse ?? ""} onChange={e => setDialog({ ...dialog, registro_tse: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={dialog.tipo} onValueChange={v => setDialog({ ...dialog, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["eleitoral","opiniao","tracking","qualitativa","interna"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={dialog.status} onValueChange={v => setDialog({ ...dialog, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["planejada","em_campo","concluida","divulgada","cancelada"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Amostra</Label><Input type="number" value={dialog.amostra ?? ""} onChange={e => setDialog({ ...dialog, amostra: Number(e.target.value) || null })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Margem erro %</Label><Input type="number" step="0.1" value={dialog.margem_erro ?? ""} onChange={e => setDialog({ ...dialog, margem_erro: Number(e.target.value) || null })} /></div>
                <div><Label>Início campo</Label><Input type="date" value={dialog.data_inicio_campo ?? ""} onChange={e => setDialog({ ...dialog, data_inicio_campo: e.target.value || null })} /></div>
                <div><Label>Divulgação</Label><Input type="date" value={dialog.data_divulgacao ?? ""} onChange={e => setDialog({ ...dialog, data_divulgacao: e.target.value || null })} /></div>
              </div>
              <div><Label>Metodologia</Label><Textarea value={dialog.metodologia ?? ""} onChange={e => setDialog({ ...dialog, metodologia: e.target.value })} rows={2} /></div>
              <div><Label>Observações</Label><Textarea value={dialog.observacoes ?? ""} onChange={e => setDialog({ ...dialog, observacoes: e.target.value })} rows={2} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button onClick={() => upsert.mutate(dialog, { onSuccess: () => setDialog(null) })}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resDialog} onOpenChange={o => !o && setResDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Resultado</DialogTitle></DialogHeader>
          {resDialog && (
            <div className="grid gap-3">
              <div><Label>Cenário</Label><Input value={resDialog.cenario} onChange={e => setResDialog({ ...resDialog, cenario: e.target.value })} placeholder="estimulada / espontânea" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Candidato</Label><Input value={resDialog.candidato} onChange={e => setResDialog({ ...resDialog, candidato: e.target.value })} /></div>
                <div><Label>Partido</Label><Input value={resDialog.partido} onChange={e => setResDialog({ ...resDialog, partido: e.target.value })} /></div>
              </div>
              <div><Label>Percentual %</Label><Input type="number" step="0.1" value={resDialog.percentual} onChange={e => setResDialog({ ...resDialog, percentual: Number(e.target.value) })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResDialog(null)}>Cancelar</Button>
            <Button onClick={() => upsertRes.mutate(resDialog, { onSuccess: () => setResDialog(null) })}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CaptacaoTab() {
  const { data: doadores } = useCaptacao();
  const upsert = useUpsertDoador();
  const del = useDeleteDoador();
  const [dialog, setDialog] = useState<any>(null);

  const totalEstimado = doadores?.reduce((s, d) => s + Number(d.valor_estimado || 0), 0) ?? 0;
  const totalConfirmado = doadores?.reduce((s, d) => s + Number(d.valor_confirmado || 0), 0) ?? 0;
  const totalRecebido = doadores?.reduce((s, d) => s + Number(d.valor_recebido || 0), 0) ?? 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Pipeline</div><div className="text-2xl font-bold">R$ {totalEstimado.toLocaleString("pt-BR")}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Confirmado</div><div className="text-2xl font-bold">R$ {totalConfirmado.toLocaleString("pt-BR")}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Recebido</div><div className="text-2xl font-bold">R$ {totalRecebido.toLocaleString("pt-BR")}</div></CardContent></Card>
      </div>
      <div className="flex justify-end">
        <Button onClick={() => setDialog({ status: "prospect", valor_estimado: 0, valor_confirmado: 0, valor_recebido: 0 })}><Plus className="h-4 w-4 mr-1" />Novo Doador</Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Estimado</TableHead>
              <TableHead>Confirmado</TableHead>
              <TableHead>Recebido</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doadores?.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.nome}</TableCell>
                <TableCell><Badge variant="outline">{d.status}</Badge></TableCell>
                <TableCell>R$ {Number(d.valor_estimado).toLocaleString("pt-BR")}</TableCell>
                <TableCell>R$ {Number(d.valor_confirmado).toLocaleString("pt-BR")}</TableCell>
                <TableCell>R$ {Number(d.valor_recebido).toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-xs">{d.email}<br/>{d.telefone}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => setDialog(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) del.mutate(d.id); }}>×</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!dialog} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{dialog?.id ? "Editar" : "Novo"} Doador</DialogTitle></DialogHeader>
          {dialog && (
            <div className="grid gap-3">
              <div><Label>Nome</Label><Input value={dialog.nome ?? ""} onChange={e => setDialog({ ...dialog, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Documento</Label><Input value={dialog.documento ?? ""} onChange={e => setDialog({ ...dialog, documento: e.target.value })} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={dialog.status} onValueChange={v => setDialog({ ...dialog, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["prospect","contatado","negociando","confirmado","recebido","recusado"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input type="email" value={dialog.email ?? ""} onChange={e => setDialog({ ...dialog, email: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={dialog.telefone ?? ""} onChange={e => setDialog({ ...dialog, telefone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Estimado R$</Label><Input type="number" value={dialog.valor_estimado ?? 0} onChange={e => setDialog({ ...dialog, valor_estimado: Number(e.target.value) })} /></div>
                <div><Label>Confirmado R$</Label><Input type="number" value={dialog.valor_confirmado ?? 0} onChange={e => setDialog({ ...dialog, valor_confirmado: Number(e.target.value) })} /></div>
                <div><Label>Recebido R$</Label><Input type="number" value={dialog.valor_recebido ?? 0} onChange={e => setDialog({ ...dialog, valor_recebido: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Observações</Label><Textarea value={dialog.observacoes ?? ""} onChange={e => setDialog({ ...dialog, observacoes: e.target.value })} rows={2} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button onClick={() => upsert.mutate(dialog, { onSuccess: () => setDialog(null) })}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
