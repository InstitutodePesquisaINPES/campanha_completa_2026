import { useState } from "react";
import { useMateriais, useCreateMaterial, useDeleteMaterial, useEstoques, useCreateEstoque, useMovimentacoes, useCreateMovimentacao, tipoMaterialLabels, tipoMovimentacaoLabels } from "@/hooks/useMateriais";
import { useMunicipios } from "@/hooks/useTerritorio";
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
import { Loader2, Plus, Trash2, Package, Warehouse, ArrowUpDown, AlertTriangle } from "lucide-react";

export function MateriaisPage() {
  const { toast } = useToast();
  const { data: materiais = [], isLoading: matLoading } = useMateriais();
  const { data: estoques = [], isLoading: estLoading } = useEstoques();
  const { data: municipios = [] } = useMunicipios();
  const createMaterial = useCreateMaterial();
  const deleteMaterial = useDeleteMaterial();
  const createEstoque = useCreateEstoque();
  const createMovimentacao = useCreateMovimentacao();

  const [matOpen, setMatOpen] = useState(false);
  const [matForm, setMatForm] = useState({ nome: "", tipo: "outros" as any, custo_unitario: "" });

  const [estOpen, setEstOpen] = useState(false);
  const [estForm, setEstForm] = useState({ material_id: "", centro_distribuicao: "Principal", quantidade_atual: "0", quantidade_minima: "0", municipio_id: "" });

  const [movOpen, setMovOpen] = useState(false);
  const [movForm, setMovForm] = useState({ estoque_id: "", tipo: "entrada" as any, quantidade: "", motivo: "" });

  const handleCreateMaterial = async () => {
    if (!matForm.nome.trim()) { toast({ variant: "destructive", title: "Informe o nome" }); return; }
    try {
      await createMaterial.mutateAsync({ nome: matForm.nome.trim(), tipo: matForm.tipo, custo_unitario: matForm.custo_unitario ? parseFloat(matForm.custo_unitario) : undefined });
      toast({ title: "Material cadastrado!" }); setMatOpen(false); setMatForm({ nome: "", tipo: "outros", custo_unitario: "" });
    } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
  };

  const handleCreateEstoque = async () => {
    if (!estForm.material_id) { toast({ variant: "destructive", title: "Selecione o material" }); return; }
    try {
      await createEstoque.mutateAsync({
        material_id: estForm.material_id, centro_distribuicao: estForm.centro_distribuicao || "Principal",
        quantidade_atual: parseInt(estForm.quantidade_atual) || 0, quantidade_minima: parseInt(estForm.quantidade_minima) || 0,
        municipio_id: estForm.municipio_id || undefined,
      });
      toast({ title: "Estoque criado!" }); setEstOpen(false);
    } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
  };

  const handleMovimentacao = async () => {
    if (!movForm.estoque_id || !movForm.quantidade) { toast({ variant: "destructive", title: "Preencha estoque e quantidade" }); return; }
    try {
      await createMovimentacao.mutateAsync({
        estoque_id: movForm.estoque_id, tipo: movForm.tipo,
        quantidade: parseInt(movForm.quantidade), motivo: movForm.motivo || undefined,
      });
      toast({ title: "Movimentação registrada!" }); setMovOpen(false); setMovForm({ estoque_id: "", tipo: "entrada", quantidade: "", motivo: "" });
    } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
  };

  return (
    <Tabs defaultValue="estoques">
      <TabsList>
        <TabsTrigger value="estoques"><Warehouse className="h-3 w-3 mr-1" />Estoques ({estoques.length})</TabsTrigger>
        <TabsTrigger value="materiais"><Package className="h-3 w-3 mr-1" />Materiais ({materiais.length})</TabsTrigger>
      </TabsList>

      {/* ESTOQUES */}
      <TabsContent value="estoques">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Controle de Estoque</CardTitle>
            <div className="flex gap-2">
              <Dialog open={movOpen} onOpenChange={setMovOpen}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><ArrowUpDown className="h-4 w-4 mr-1" />Movimentar</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nova Movimentação</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Estoque</Label>
                      <Select value={movForm.estoque_id} onValueChange={(v) => setMovForm({ ...movForm, estoque_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{estoques.map((e: any) => (<SelectItem key={e.id} value={e.id}>{e.materiais?.nome} — {e.centro_distribuicao}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Tipo</Label>
                        <Select value={movForm.tipo} onValueChange={(v) => setMovForm({ ...movForm, tipo: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(tipoMovimentacaoLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1"><Label>Quantidade</Label><Input type="number" value={movForm.quantidade} onChange={(e) => setMovForm({ ...movForm, quantidade: e.target.value })} /></div>
                    </div>
                    <div className="space-y-1"><Label>Motivo</Label><Input value={movForm.motivo} onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })} /></div>
                  </div>
                  <DialogFooter><Button onClick={handleMovimentacao} disabled={createMovimentacao.isPending}>Registrar</Button></DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={estOpen} onOpenChange={setEstOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Estoque</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Criar Estoque</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Material *</Label>
                      <Select value={estForm.material_id} onValueChange={(v) => setEstForm({ ...estForm, material_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{materiais.map((m: any) => (<SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1"><Label>Centro Distribuição</Label><Input value={estForm.centro_distribuicao} onChange={(e) => setEstForm({ ...estForm, centro_distribuicao: e.target.value })} /></div>
                      <div className="space-y-1">
                        <Label>Município</Label>
                        <Select value={estForm.municipio_id} onValueChange={(v) => setEstForm({ ...estForm, municipio_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{municipios.map((m: any) => (<SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1"><Label>Qtd Inicial</Label><Input type="number" value={estForm.quantidade_atual} onChange={(e) => setEstForm({ ...estForm, quantidade_atual: e.target.value })} /></div>
                      <div className="space-y-1"><Label>Qtd Mínima</Label><Input type="number" value={estForm.quantidade_minima} onChange={(e) => setEstForm({ ...estForm, quantidade_minima: e.target.value })} /></div>
                    </div>
                  </div>
                  <DialogFooter><Button onClick={handleCreateEstoque}>Criar</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {estLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : estoques.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhum estoque cadastrado.</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Material</TableHead><TableHead>Centro</TableHead><TableHead>Município</TableHead>
                  <TableHead>Atual</TableHead><TableHead>Mínimo</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {estoques.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.materiais?.nome}</TableCell>
                      <TableCell className="text-xs">{e.centro_distribuicao}</TableCell>
                      <TableCell className="text-xs">{e.municipios?.nome || "—"}</TableCell>
                      <TableCell className="font-mono">{e.quantidade_atual}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{e.quantidade_minima}</TableCell>
                      <TableCell>
                        {e.quantidade_atual <= e.quantidade_minima ? (
                          <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="h-3 w-3" />Baixo</Badge>
                        ) : <Badge variant="outline" className="text-[10px] bg-green-500/15 text-green-400">OK</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* MATERIAIS */}
      <TabsContent value="materiais">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Cadastro de Materiais</CardTitle>
            <Dialog open={matOpen} onOpenChange={setMatOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Material</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cadastrar Material</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1"><Label>Nome *</Label><Input value={matForm.nome} onChange={(e) => setMatForm({ ...matForm, nome: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Tipo</Label>
                      <Select value={matForm.tipo} onValueChange={(v) => setMatForm({ ...matForm, tipo: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(tipoMaterialLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label>Custo Unitário (R$)</Label><Input type="number" step="0.01" value={matForm.custo_unitario} onChange={(e) => setMatForm({ ...matForm, custo_unitario: e.target.value })} /></div>
                  </div>
                </div>
                <DialogFooter><Button onClick={handleCreateMaterial} disabled={createMaterial.isPending}>Salvar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {matLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : materiais.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhum material cadastrado.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Custo Unit.</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {materiais.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.nome}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{tipoMaterialLabels[m.tipo]}</Badge></TableCell>
                      <TableCell className="font-mono">{m.custo_unitario ? `R$ ${Number(m.custo_unitario).toFixed(2)}` : "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                          if (!confirm(`Excluir "${m.nome}"?`)) return;
                          try { await deleteMaterial.mutateAsync(m.id); toast({ title: "Material excluído!" }); }
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
  );
}
