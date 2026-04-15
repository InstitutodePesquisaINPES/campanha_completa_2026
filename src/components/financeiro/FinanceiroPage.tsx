import { useState } from "react";
import { useCentrosCusto, useCreateCentroCusto, useDeleteCentroCusto, useDespesas, useCreateDespesa, useUpdateDespesa, useDeleteDespesa, useReceitas, useCreateReceita, useDeleteReceita, categoriaDespesaLabels, statusDespesaLabels, statusDespesaColors, tipoReceitaLabels } from "@/hooks/useFinanceiro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Building2 } from "lucide-react";

export function FinanceiroPage() {
  const { toast } = useToast();
  const { data: centros = [] } = useCentrosCusto();
  const [centroFilter, setCentroFilter] = useState("all");
  const { data: despesas = [], isLoading: despLoading } = useDespesas(centroFilter !== "all" ? centroFilter : undefined);
  const { data: receitas = [], isLoading: recLoading } = useReceitas(centroFilter !== "all" ? centroFilter : undefined);
  const createCentro = useCreateCentroCusto();
  const deleteCentro = useDeleteCentroCusto();
  const createDespesa = useCreateDespesa();
  const updateDespesa = useUpdateDespesa();
  const deleteDespesa = useDeleteDespesa();
  const createReceita = useCreateReceita();
  const deleteReceita = useDeleteReceita();

  // Centro form
  const [ccOpen, setCcOpen] = useState(false);
  const [ccForm, setCcForm] = useState({ nome: "", orcamento_previsto: "" });

  // Despesa form
  const [despOpen, setDespOpen] = useState(false);
  const [despForm, setDespForm] = useState({ descricao: "", valor: "", categoria: "outros" as any, centro_custo_id: "", documento_tipo: "", documento_numero: "" });

  // Receita form
  const [recOpen, setRecOpen] = useState(false);
  const [recForm, setRecForm] = useState({ valor: "", tipo: "outros" as any, centro_custo_id: "", descricao: "" });

  const totalDespesas = despesas.reduce((s: number, d: any) => s + Number(d.valor || 0), 0);
  const totalReceitas = receitas.reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4"><p className="text-[10px] text-muted-foreground">Receitas</p><p className="text-lg font-bold text-green-400">R$ {totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-[10px] text-muted-foreground">Despesas</p><p className="text-lg font-bold text-red-400">R$ {totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-[10px] text-muted-foreground">Saldo</p><p className={`text-lg font-bold ${saldo >= 0 ? "text-green-400" : "text-red-400"}`}>R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-[10px] text-muted-foreground">Centros de Custo</p><p className="text-lg font-bold">{centros.length}</p></CardContent></Card>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={centroFilter} onValueChange={setCentroFilter}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Filtrar por centro" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os centros</SelectItem>
            {centros.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="despesas">
        <TabsList>
          <TabsTrigger value="despesas"><TrendingDown className="h-3 w-3 mr-1" />Despesas ({despesas.length})</TabsTrigger>
          <TabsTrigger value="receitas"><TrendingUp className="h-3 w-3 mr-1" />Receitas ({receitas.length})</TabsTrigger>
          <TabsTrigger value="centros"><Building2 className="h-3 w-3 mr-1" />Centros ({centros.length})</TabsTrigger>
        </TabsList>

        {/* DESPESAS */}
        <TabsContent value="despesas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Despesas</CardTitle>
              <Dialog open={despOpen} onOpenChange={setDespOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Despesa</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Registrar Despesa</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1"><Label>Descrição *</Label><Input value={despForm.descricao} onChange={(e) => setDespForm({ ...despForm, descricao: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1"><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={despForm.valor} onChange={(e) => setDespForm({ ...despForm, valor: e.target.value })} /></div>
                      <div className="space-y-1">
                        <Label>Categoria</Label>
                        <Select value={despForm.categoria} onValueChange={(v) => setDespForm({ ...despForm, categoria: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(categoriaDespesaLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Centro de Custo</Label>
                        <Select value={despForm.centro_custo_id} onValueChange={(v) => setDespForm({ ...despForm, centro_custo_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{centros.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1"><Label>Nº Documento</Label><Input value={despForm.documento_numero} onChange={(e) => setDespForm({ ...despForm, documento_numero: e.target.value })} /></div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={async () => {
                      if (!despForm.descricao.trim() || !despForm.valor) { toast({ variant: "destructive", title: "Preencha descrição e valor" }); return; }
                      try {
                        await createDespesa.mutateAsync({
                          descricao: despForm.descricao.trim(), valor: parseFloat(despForm.valor), categoria: despForm.categoria,
                          centro_custo_id: despForm.centro_custo_id || undefined, documento_numero: despForm.documento_numero || undefined,
                        });
                        toast({ title: "Despesa registrada!" }); setDespOpen(false);
                        setDespForm({ descricao: "", valor: "", categoria: "outros", centro_custo_id: "", documento_tipo: "", documento_numero: "" });
                      } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
                    }} disabled={createDespesa.isPending}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {despLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : despesas.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhuma despesa registrada.</p>
              ) : (
                <div className="overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Categoria</TableHead><TableHead>Centro</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead></TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {despesas.map((d: any) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">{d.descricao}</TableCell>
                          <TableCell className="font-mono text-red-400">R$ {Number(d.valor).toFixed(2)}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{categoriaDespesaLabels[d.categoria]}</Badge></TableCell>
                          <TableCell className="text-xs">{d.centros_custo?.nome || "—"}</TableCell>
                          <TableCell>
                            <Select value={d.status} onValueChange={(v) => updateDespesa.mutate({ id: d.id, status: v as any })}>
                              <SelectTrigger className="h-7 w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.entries(statusDespesaLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-xs">{new Date(d.data_despesa).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                              if (!confirm("Excluir despesa?")) return;
                              try { await deleteDespesa.mutateAsync(d.id); toast({ title: "Excluída!" }); }
                              catch (err: any) { toast({ variant: "destructive", description: err.message }); }
                            }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RECEITAS */}
        <TabsContent value="receitas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Receitas</CardTitle>
              <Dialog open={recOpen} onOpenChange={setRecOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Receita</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Registrar Receita</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1"><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={recForm.valor} onChange={(e) => setRecForm({ ...recForm, valor: e.target.value })} /></div>
                      <div className="space-y-1">
                        <Label>Tipo</Label>
                        <Select value={recForm.tipo} onValueChange={(v) => setRecForm({ ...recForm, tipo: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(tipoReceitaLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1"><Label>Descrição</Label><Input value={recForm.descricao} onChange={(e) => setRecForm({ ...recForm, descricao: e.target.value })} /></div>
                    <div className="space-y-1">
                      <Label>Centro de Custo</Label>
                      <Select value={recForm.centro_custo_id} onValueChange={(v) => setRecForm({ ...recForm, centro_custo_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{centros.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={async () => {
                      if (!recForm.valor) { toast({ variant: "destructive", title: "Informe o valor" }); return; }
                      try {
                        await createReceita.mutateAsync({
                          valor: parseFloat(recForm.valor), tipo: recForm.tipo,
                          centro_custo_id: recForm.centro_custo_id || undefined, descricao: recForm.descricao || undefined,
                        });
                        toast({ title: "Receita registrada!" }); setRecOpen(false);
                        setRecForm({ valor: "", tipo: "outros", centro_custo_id: "", descricao: "" });
                      } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
                    }} disabled={createReceita.isPending}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {recLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : receitas.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhuma receita registrada.</p>
              ) : (
                <div className="overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Tipo</TableHead><TableHead>Centro</TableHead><TableHead>Data</TableHead><TableHead></TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {receitas.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.descricao || "—"}</TableCell>
                          <TableCell className="font-mono text-green-400">R$ {Number(r.valor).toFixed(2)}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{tipoReceitaLabels[r.tipo]}</Badge></TableCell>
                          <TableCell className="text-xs">{r.centros_custo?.nome || "—"}</TableCell>
                          <TableCell className="text-xs">{new Date(r.data).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                              if (!confirm("Excluir receita?")) return;
                              try { await deleteReceita.mutateAsync(r.id); toast({ title: "Excluída!" }); }
                              catch (err: any) { toast({ variant: "destructive", description: err.message }); }
                            }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CENTROS DE CUSTO */}
        <TabsContent value="centros">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Centros de Custo</CardTitle>
              <Dialog open={ccOpen} onOpenChange={setCcOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Centro</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Criar Centro de Custo</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1"><Label>Nome *</Label><Input value={ccForm.nome} onChange={(e) => setCcForm({ ...ccForm, nome: e.target.value })} /></div>
                    <div className="space-y-1"><Label>Orçamento Previsto (R$)</Label><Input type="number" step="0.01" value={ccForm.orcamento_previsto} onChange={(e) => setCcForm({ ...ccForm, orcamento_previsto: e.target.value })} /></div>
                  </div>
                  <DialogFooter>
                    <Button onClick={async () => {
                      if (!ccForm.nome.trim()) { toast({ variant: "destructive", title: "Informe o nome" }); return; }
                      try {
                        await createCentro.mutateAsync({ nome: ccForm.nome.trim(), orcamento_previsto: ccForm.orcamento_previsto ? parseFloat(ccForm.orcamento_previsto) : undefined });
                        toast({ title: "Centro criado!" }); setCcOpen(false); setCcForm({ nome: "", orcamento_previsto: "" });
                      } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
                    }}>Criar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {centros.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum centro de custo cadastrado.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Orçamento</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {centros.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.nome}</TableCell>
                        <TableCell className="font-mono">R$ {Number(c.orcamento_previsto || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                            if (!confirm(`Excluir "${c.nome}"?`)) return;
                            try { await deleteCentro.mutateAsync(c.id); toast({ title: "Centro excluído!" }); }
                            catch (err: any) { toast({ variant: "destructive", description: err.message }); }
                          }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
