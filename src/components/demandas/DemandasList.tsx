import { useState } from "react";
import { useDemandas, useCreateDemanda, useDeleteDemanda, categoriaLabels, prioridadeLabels, prioridadeColors, statusLabels, statusColors, origemLabels } from "@/hooks/useDemandas";
import { usePessoas } from "@/hooks/usePessoas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Eye, AlertTriangle, Clock } from "lucide-react";

export function DemandasList({ onSelect }: { onSelect: (id: string) => void }) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("all");
  const { data: demandas = [], isLoading } = useDemandas(statusFilter, prioridadeFilter);
  const createDemanda = useCreateDemanda();
  const deleteDemanda = useDeleteDemanda();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titulo: "", descricao: "", categoria: "outros" as any,
    prioridade: "media" as any, origem: "" as any, pessoa_id: "",
  });

  const [pessoaSearch, setPessoaSearch] = useState("");
  const { data: pessoaResults = [] } = usePessoas(pessoaSearch || undefined);

  const handleCreate = async () => {
    if (!form.titulo.trim()) { toast({ variant: "destructive", title: "Informe o título" }); return; }
    try {
      const d = await createDemanda.mutateAsync({
        titulo: form.titulo.trim(),
        descricao: form.descricao || undefined,
        categoria: form.categoria,
        prioridade: form.prioridade,
        origem: form.origem || undefined,
        pessoa_id: form.pessoa_id || undefined,
      });
      toast({ title: `Demanda criada! Protocolo: ${d.protocolo}` });
      setOpen(false);
      setForm({ titulo: "", descricao: "", categoria: "outros", prioridade: "media", origem: "", pessoa_id: "" });
      onSelect(d.id);
    } catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); }
  };

  const isOverdue = (d: any) => d.status !== "resolvida" && d.status !== "arquivada" && d.data_prazo && new Date(d.data_prazo) < new Date();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Demandas ({demandas.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Demanda</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Abrir Demanda</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
              <div className="space-y-1"><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(categoriaLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Prioridade</Label>
                  <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(prioridadeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Origem</Label>
                  <Select value={form.origem} onValueChange={(v) => setForm({ ...form, origem: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{Object.entries(origemLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Pessoa vinculada</Label>
                <Input placeholder="Buscar pessoa por nome..." value={pessoaSearch} onChange={(e) => setPessoaSearch(e.target.value)} />
                {pessoaSearch && pessoaResults.length > 0 && (
                  <div className="border rounded max-h-32 overflow-auto">
                    {pessoaResults.slice(0, 5).map((p: any) => (
                      <button key={p.id} className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent/50" onClick={() => { setForm({ ...form, pessoa_id: p.id }); setPessoaSearch(p.full_name); }}>
                        {p.full_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createDemanda.isPending}>
                {createDemanda.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Abrir Demanda
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas prioridades</SelectItem>
              {Object.entries(prioridadeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : demandas.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhuma demanda encontrada.</p>
        ) : (
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Pessoa</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demandas.map((d: any) => (
                  <TableRow key={d.id} className="cursor-pointer hover:bg-accent/50" onClick={() => onSelect(d.id)}>
                    <TableCell className="font-mono text-xs">{d.protocolo}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{d.titulo}</TableCell>
                    <TableCell className="text-xs">{d.pessoas?.full_name || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{categoriaLabels[d.categoria] || d.categoria}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${prioridadeColors[d.prioridade] || ""}`}>{prioridadeLabels[d.prioridade]}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${statusColors[d.status] || ""}`}>{statusLabels[d.status]}</Badge></TableCell>
                    <TableCell>
                      {isOverdue(d) ? (
                        <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="h-3 w-3" />Vencido</Badge>
                      ) : d.data_prazo ? (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(d.data_prazo).toLocaleDateString("pt-BR")}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onSelect(d.id); }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Excluir "${d.protocolo}"?`)) return;
                          try { await deleteDemanda.mutateAsync(d.id); toast({ title: "Demanda excluída!" }); }
                          catch (err: any) { toast({ variant: "destructive", description: err.message }); }
                        }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
