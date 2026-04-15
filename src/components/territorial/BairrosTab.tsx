import { useState } from "react";
import { useEstados, useMunicipios, useBairros, useCreateBairro, useDeleteBairro } from "@/hooks/useTerritorio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Search } from "lucide-react";

const classificacaoColors: Record<string, string> = {
  reduto: "bg-green-500/15 text-green-400 border-green-500/30",
  expansao: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  disputa: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  risco: "bg-red-500/15 text-red-400 border-red-500/30",
  baixa_presenca: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const classificacaoLabels: Record<string, string> = {
  reduto: "Reduto",
  expansao: "Expansão",
  disputa: "Disputa",
  risco: "Risco",
  baixa_presenca: "Baixa Presença",
};

export function BairrosTab() {
  const { toast } = useToast();
  const { data: estados = [] } = useEstados();
  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [municipioFilter, setMunicipioFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const { data: municipios = [] } = useMunicipios(estadoFilter || undefined);
  const { data: bairros = [], isLoading } = useBairros(municipioFilter || undefined);
  const createBairro = useCreateBairro();
  const deleteBairro = useDeleteBairro();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", municipio_id: "", classificacao: "" });

  const filtered = bairros.filter((b: any) =>
    b.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.nome || !form.municipio_id) {
      toast({ variant: "destructive", title: "Preencha nome e município" });
      return;
    }
    try {
      await createBairro.mutateAsync({
        nome: form.nome,
        municipio_id: form.municipio_id,
        classificacao: form.classificacao || undefined,
      });
      toast({ title: "Bairro criado!" });
      setOpen(false);
      setForm({ nome: "", municipio_id: "", classificacao: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bairros ({filtered.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Bairro</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Bairro</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Município *</Label>
                <Select value={form.municipio_id} onValueChange={(v) => setForm({ ...form, municipio_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {municipios.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Classificação Territorial</Label>
                <Select value={form.classificacao} onValueChange={(v) => setForm({ ...form, classificacao: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(classificacaoLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createBairro.isPending}>
                {createBairro.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v); setMunicipioFilter(""); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {estados.map((e: any) => (
                <SelectItem key={e.id} value={e.id}>{e.sigla}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={municipioFilter} onValueChange={setMunicipioFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Município" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {municipios.map((m: any) => (
                <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar bairro..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            {municipioFilter ? "Nenhum bairro encontrado. Adicione o primeiro!" : "Selecione um município para ver os bairros."}
          </p>
        ) : (
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bairro</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>Classificação</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.nome}</TableCell>
                    <TableCell>{(b.municipios as any)?.nome || "—"}</TableCell>
                    <TableCell>
                      {b.classificacao ? (
                        <Badge variant="outline" className={classificacaoColors[b.classificacao] || ""}>
                          {classificacaoLabels[b.classificacao] || b.classificacao}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={async () => {
                        if (!confirm(`Excluir "${b.nome}"?`)) return;
                        try { await deleteBairro.mutateAsync(b.id); toast({ title: "Bairro excluído!" }); }
                        catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); }
                      }}>
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
