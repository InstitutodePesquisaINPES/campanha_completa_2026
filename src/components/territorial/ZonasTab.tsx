import { useState } from "react";
import { useEstados, useMunicipios, useZonas, useCreateZona, useDeleteZona, useSecoes, useCreateSecao, useDeleteSecao } from "@/hooks/useTerritorio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ChevronDown, ChevronRight, Vote } from "lucide-react";

function SecoesPanel({ zonaId, zonaNumero }: { zonaId: string; zonaNumero: number }) {
  const { toast } = useToast();
  const { data: secoes = [], isLoading } = useSecoes(zonaId);
  const createSecao = useCreateSecao();
  const deleteSecao = useDeleteSecao();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ numero_secao: "", local_votacao: "", endereco: "", eleitores_aptos: "" });

  const handleCreate = async () => {
    if (!form.numero_secao) { toast({ variant: "destructive", title: "Informe o número da seção" }); return; }
    try {
      await createSecao.mutateAsync({
        zona_id: zonaId,
        numero_secao: parseInt(form.numero_secao),
        local_votacao: form.local_votacao || undefined,
        endereco: form.endereco || undefined,
        eleitores_aptos: form.eleitores_aptos ? parseInt(form.eleitores_aptos) : undefined,
      });
      toast({ title: "Seção criada!" });
      setOpen(false);
      setForm({ numero_secao: "", local_votacao: "", endereco: "", eleitores_aptos: "" });
    } catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); }
  };

  return (
    <div className="pl-6 py-2 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">Seções da Zona {zonaNumero} ({secoes.length})</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" />Seção</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Seção — Zona {zonaNumero}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label>Nº Seção *</Label><Input type="number" value={form.numero_secao} onChange={(e) => setForm({ ...form, numero_secao: e.target.value })} /></div>
                <div className="space-y-1"><Label>Eleitores aptos</Label><Input type="number" value={form.eleitores_aptos} onChange={(e) => setForm({ ...form, eleitores_aptos: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label>Local de votação</Label><Input value={form.local_votacao} onChange={(e) => setForm({ ...form, local_votacao: e.target.value })} /></div>
              <div className="space-y-1"><Label>Endereço</Label><Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createSecao.isPending}>
                {createSecao.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : secoes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma seção cadastrada.</p>
      ) : (
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-xs">Seção</TableHead>
            <TableHead className="text-xs">Local</TableHead>
            <TableHead className="text-xs">Endereço</TableHead>
            <TableHead className="text-xs text-right">Eleitores</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {secoes.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="text-xs font-mono">{s.numero_secao}</TableCell>
                <TableCell className="text-xs">{s.local_votacao || "—"}</TableCell>
                <TableCell className="text-xs truncate max-w-[200px]">{s.endereco || "—"}</TableCell>
                <TableCell className="text-xs text-right">{s.eleitores_aptos?.toLocaleString("pt-BR") || "—"}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={async () => {
                    if (!confirm("Excluir seção?")) return;
                    try { await deleteSecao.mutateAsync(s.id); toast({ title: "Seção excluída!" }); }
                    catch (e: any) { toast({ variant: "destructive", description: e.message }); }
                  }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export function ZonasTab() {
  const { toast } = useToast();
  const { data: estados = [] } = useEstados();
  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [municipioFilter, setMunicipioFilter] = useState<string>("");
  const { data: municipios = [] } = useMunicipios(estadoFilter || undefined);
  const { data: zonas = [], isLoading } = useZonas(municipioFilter || undefined);
  const createZona = useCreateZona();
  const deleteZona = useDeleteZona();
  const [openZonas, setOpenZonas] = useState<Record<string, boolean>>({});

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ municipio_id: "", numero_zona: "", tribunal_regional: "" });

  const handleCreate = async () => {
    const mid = form.municipio_id || municipioFilter;
    if (!mid || !form.numero_zona) { toast({ variant: "destructive", title: "Preencha município e número da zona" }); return; }
    try {
      await createZona.mutateAsync({
        municipio_id: mid,
        numero_zona: parseInt(form.numero_zona),
        tribunal_regional: form.tribunal_regional || undefined,
      });
      toast({ title: "Zona criada!" });
      setOpen(false);
      setForm({ municipio_id: "", numero_zona: "", tribunal_regional: "" });
    } catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Vote className="h-5 w-5" />Zonas Eleitorais ({zonas.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Zona</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Zona Eleitoral</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Município *</Label>
                <Select value={form.municipio_id || municipioFilter} onValueChange={(v) => setForm({ ...form, municipio_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{municipios.map((m: any) => (<SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label>Nº Zona *</Label><Input type="number" value={form.numero_zona} onChange={(e) => setForm({ ...form, numero_zona: e.target.value })} /></div>
                <div className="space-y-1"><Label>TRE</Label><Input value={form.tribunal_regional} onChange={(e) => setForm({ ...form, tribunal_regional: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createZona.isPending}>
                {createZona.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Salvar
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
        ) : zonas.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Selecione um município e cadastre zonas eleitorais.</p>
        ) : (
          <div className="space-y-1">
            {zonas.map((z: any) => (
              <Collapsible key={z.id} open={openZonas[z.id]} onOpenChange={(v) => setOpenZonas({ ...openZonas, [z.id]: v })}>
                <div className="flex items-center justify-between p-2 rounded hover:bg-accent/50">
                  <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                    {openZonas[z.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-medium text-sm">Zona {z.numero_zona}</span>
                    <span className="text-xs text-muted-foreground">— {(z.municipios as any)?.nome}</span>
                    {z.tribunal_regional && <span className="text-xs text-muted-foreground">({z.tribunal_regional})</span>}
                  </CollapsibleTrigger>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                    if (!confirm(`Excluir Zona ${z.numero_zona}?`)) return;
                    try { await deleteZona.mutateAsync(z.id); toast({ title: "Zona excluída!" }); }
                    catch (e: any) { toast({ variant: "destructive", description: e.message }); }
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <CollapsibleContent>
                  <SecoesPanel zonaId={z.id} zonaNumero={z.numero_zona} />
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
