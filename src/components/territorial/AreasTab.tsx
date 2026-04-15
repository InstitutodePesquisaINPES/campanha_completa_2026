import { useState } from "react";
import { useEstados, useMunicipios, useAreasAtuacao, useCreateAreaAtuacao, useDeleteAreaAtuacao, useBairros } from "@/hooks/useTerritorio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Users } from "lucide-react";

const tipoLabels: Record<string, string> = {
  equipe: "Equipe",
  lider: "Líder",
  coordenador: "Coordenador",
};

const tipoColors: Record<string, string> = {
  equipe: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  lider: "bg-green-500/15 text-green-400 border-green-500/30",
  coordenador: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

export function AreasTab() {
  const { toast } = useToast();
  const { data: estados = [] } = useEstados();
  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [municipioFilter, setMunicipioFilter] = useState<string>("");
  const { data: municipios = [] } = useMunicipios(estadoFilter || undefined);
  const { data: areas = [], isLoading } = useAreasAtuacao(municipioFilter || undefined);
  const createArea = useCreateAreaAtuacao();
  const deleteArea = useDeleteAreaAtuacao();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo: "equipe", municipio_id: "", observacoes: "" });

  const handleCreate = async () => {
    const mid = form.municipio_id || municipioFilter;
    if (!form.nome || !mid) { toast({ variant: "destructive", title: "Preencha nome e município" }); return; }
    try {
      await createArea.mutateAsync({ nome: form.nome, tipo: form.tipo, municipio_id: mid, observacoes: form.observacoes || undefined });
      toast({ title: "Área de atuação criada!" });
      setOpen(false);
      setForm({ nome: "", tipo: "equipe", municipio_id: "", observacoes: "" });
    } catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Áreas de Atuação ({areas.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Área</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Área de Atuação</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Município *</Label>
                <Select value={form.municipio_id || municipioFilter} onValueChange={(v) => setForm({ ...form, municipio_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{municipios.map((m: any) => (<SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div className="space-y-1">
                  <Label>Tipo *</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipe">Equipe</SelectItem>
                      <SelectItem value="lider">Líder</SelectItem>
                      <SelectItem value="coordenador">Coordenador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1"><Label>Observações</Label><Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createArea.isPending}>
                {createArea.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v); setMunicipioFilter(""); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {estados.map((e: any) => (<SelectItem key={e.id} value={e.id}>{e.sigla}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={municipioFilter} onValueChange={setMunicipioFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Município" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {municipios.map((m: any) => (<SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : areas.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhuma área de atuação cadastrada.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Município</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={tipoColors[a.tipo] || ""}>{tipoLabels[a.tipo] || a.tipo}</Badge>
                  </TableCell>
                  <TableCell>{(a.municipios as any)?.nome || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{a.observacoes || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={async () => {
                      if (!confirm(`Excluir "${a.nome}"?`)) return;
                      try { await deleteArea.mutateAsync(a.id); toast({ title: "Área excluída!" }); }
                      catch (e: any) { toast({ variant: "destructive", description: e.message }); }
                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
