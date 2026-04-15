import { useState } from "react";
import { useAgendaItems, useCreateAgenda, useDeleteAgenda, tipoAgendaLabels, statusAgendaLabels, statusAgendaColors } from "@/hooks/useAgenda";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Eye, Calendar, MapPin } from "lucide-react";

export function AgendaList({ onSelect }: { onSelect: (id: string) => void }) {
  const { toast } = useToast();
  const { data: items = [], isLoading } = useAgendaItems();
  const createAgenda = useCreateAgenda();
  const deleteAgenda = useDeleteAgenda();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titulo: "", tipo: "evento" as any, data_inicio: "", data_fim: "",
    local: "", descricao: "",
  });

  const handleCreate = async () => {
    if (!form.titulo.trim() || !form.data_inicio) {
      toast({ variant: "destructive", title: "Informe título e data de início" }); return;
    }
    try {
      const item = await createAgenda.mutateAsync({
        titulo: form.titulo.trim(),
        tipo: form.tipo,
        data_inicio: new Date(form.data_inicio).toISOString(),
        data_fim: form.data_fim ? new Date(form.data_fim).toISOString() : undefined,
        local: form.local || undefined,
        descricao: form.descricao || undefined,
      });
      toast({ title: "Evento criado!" });
      setOpen(false);
      setForm({ titulo: "", tipo: "evento", data_inicio: "", data_fim: "", local: "", descricao: "" });
      onSelect(item.id);
    } catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); }
  };

  // Group by date
  const grouped = items.reduce((acc: Record<string, any[]>, item: any) => {
    const date = new Date(item.data_inicio).toLocaleDateString("pt-BR");
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Agenda ({items.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Evento</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Criar Evento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(tipoAgendaLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Local</Label><Input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label>Data/Hora Início *</Label><Input type="datetime-local" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} /></div>
                <div className="space-y-1"><Label>Data/Hora Fim</Label><Input type="datetime-local" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createAgenda.isPending}>
                {createAgenda.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhum evento agendado.</p>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-auto">
            {Object.entries(grouped).map(([date, events]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{date}</span>
                </div>
                <div className="space-y-2 ml-6">
                  {(events as any[]).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border-l-2 border-primary cursor-pointer hover:bg-accent/50" onClick={() => onSelect(item.id)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.titulo}</span>
                          <Badge variant="outline" className="text-[10px]">{tipoAgendaLabels[item.tipo]}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${statusAgendaColors[item.status]}`}>{statusAgendaLabels[item.status]}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span>{new Date(item.data_inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                          {item.local && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.local}</span>}
                          {item.municipios?.nome && <span>{item.municipios.nome}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Excluir "${item.titulo}"?`)) return;
                          try { await deleteAgenda.mutateAsync(item.id); toast({ title: "Evento excluído!" }); }
                          catch (err: any) { toast({ variant: "destructive", description: err.message }); }
                        }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
