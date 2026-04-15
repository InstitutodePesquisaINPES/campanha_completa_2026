import { useState } from "react";
import { useEstados, useMunicipios, useCreateMunicipio, useDeleteMunicipio } from "@/hooks/useTerritorio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Search } from "lucide-react";

export function MunicipiosTab() {
  const { toast } = useToast();
  const { data: estados = [], isLoading: loadingEstados } = useEstados();
  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const { data: municipios = [], isLoading } = useMunicipios(estadoFilter || undefined);
  const createMunicipio = useCreateMunicipio();
  const deleteMunicipio = useDeleteMunicipio();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", estado_id: "", geocodigo_ibge: "", populacao: "", eleitorado_total: "" });

  const filtered = municipios.filter((m: any) =>
    m.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.nome || !form.estado_id) {
      toast({ variant: "destructive", title: "Preencha nome e estado" });
      return;
    }
    try {
      await createMunicipio.mutateAsync({
        nome: form.nome,
        estado_id: form.estado_id,
        geocodigo_ibge: form.geocodigo_ibge || undefined,
        populacao: form.populacao ? parseInt(form.populacao) : undefined,
        eleitorado_total: form.eleitorado_total ? parseInt(form.eleitorado_total) : undefined,
      });
      toast({ title: "Município criado!" });
      setOpen(false);
      setForm({ nome: "", estado_id: "", geocodigo_ibge: "", populacao: "", eleitorado_total: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Excluir o município "${nome}"? Todos os bairros e zonas vinculados serão removidos.`)) return;
    try {
      await deleteMunicipio.mutateAsync(id);
      toast({ title: "Município excluído!" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Municípios ({filtered.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Município</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Município</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Estado *</Label>
                <Select value={form.estado_id} onValueChange={(v) => setForm({ ...form, estado_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {estados.map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>{e.sigla} - {e.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label>Geocódigo IBGE</Label>
                  <Input value={form.geocodigo_ibge} onChange={(e) => setForm({ ...form, geocodigo_ibge: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>População</Label>
                  <Input type="number" value={form.populacao} onChange={(e) => setForm({ ...form, populacao: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Eleitorado</Label>
                  <Input type="number" value={form.eleitorado_total} onChange={(e) => setForm({ ...form, eleitorado_total: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createMunicipio.isPending}>
                {createMunicipio.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              {estados.map((e: any) => (
                <SelectItem key={e.id} value={e.id}>{e.sigla} - {e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar município..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhum município encontrado. Adicione o primeiro!</p>
        ) : (
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Município</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>IBGE</TableHead>
                  <TableHead className="text-right">População</TableHead>
                  <TableHead className="text-right">Eleitorado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell>{(m.estados as any)?.sigla || "—"}</TableCell>
                    <TableCell className="text-xs font-mono">{m.geocodigo_ibge || "—"}</TableCell>
                    <TableCell className="text-right">{m.populacao?.toLocaleString("pt-BR") || "—"}</TableCell>
                    <TableCell className="text-right">{m.eleitorado_total?.toLocaleString("pt-BR") || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id, m.nome)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
