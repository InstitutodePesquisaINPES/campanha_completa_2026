import { useMemo, useState } from "react";
import { useTarefas, useUpdateTarefa, useCreateTarefa, useDeleteTarefa, type Tarefa } from "@/hooks/useCampanhas";
import { useCanManage } from "@/hooks/useUserRoles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Calendar as CalIcon, Plus, Trash2 } from "lucide-react";

const areaColors: Record<string, string> = {
  organizacao: "bg-primary/10 text-primary border-primary/30",
  campo: "bg-success/10 text-success border-success/30",
  digital: "bg-info/10 text-info border-info/30",
  financeiro: "bg-warning/10 text-warning border-warning/30",
  juridico: "bg-destructive/10 text-destructive border-destructive/30",
  comunicacao: "bg-accent text-accent-foreground border-border",
  logistica: "bg-muted text-muted-foreground border-border",
  dados: "bg-secondary text-secondary-foreground border-border",
};

const prioColors: Record<string, string> = {
  urgente: "bg-destructive/10 text-destructive border-destructive/30",
  alta: "bg-warning/10 text-warning border-warning/30",
  media: "bg-info/10 text-info border-info/30",
  baixa: "bg-muted text-muted-foreground",
};

const AREAS = ["organizacao","campo","digital","financeiro","juridico","comunicacao","logistica","dados"] as const;
const PRIORIDADES = ["urgente","alta","media","baixa"] as const;

function NovaTarefaDialog({ campanhaId, canManage }: { campanhaId: string; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const create = useCreateTarefa();
  const [form, setForm] = useState({
    titulo: "", descricao: "", area: "campo", prioridade: "media",
    dia: 1, semana: 1, data_prevista: new Date().toISOString().slice(0, 10),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1" disabled={!canManage}><Plus className="h-3.5 w-3.5" />Nova tarefa</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar tarefa</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Área</Label>
              <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AREAS.map(a => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORIDADES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Dia (1-90)</Label><Input type="number" min={1} max={90} value={form.dia} onChange={(e) => setForm({ ...form, dia: +e.target.value })} /></div>
            <div><Label>Semana (1-13)</Label><Input type="number" min={1} max={13} value={form.semana} onChange={(e) => setForm({ ...form, semana: +e.target.value })} /></div>
            <div><Label>Data prevista</Label><Input type="date" value={form.data_prevista} onChange={(e) => setForm({ ...form, data_prevista: e.target.value })} /></div>
          </div>
          <div><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            disabled={!form.titulo || create.isPending}
            onClick={async () => {
              await create.mutateAsync({
                campanha_id: campanhaId,
                titulo: form.titulo,
                descricao: form.descricao || null,
                area: form.area as never,
                prioridade: form.prioridade as never,
                dia: form.dia,
                semana: form.semana,
                data_prevista: form.data_prevista,
              });
              setForm({ titulo: "", descricao: "", area: "campo", prioridade: "media", dia: 1, semana: 1, data_prevista: new Date().toISOString().slice(0, 10) });
              setOpen(false);
            }}
          >
            {create.isPending ? "Salvando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CronogramaTarefas({ campanhaId }: { campanhaId: string }) {
  const { data: tarefas = [], isLoading } = useTarefas(campanhaId);
  const canManage = useCanManage();
  const update = useUpdateTarefa();
  const remove = useDeleteTarefa();
  const [filtro, setFiltro] = useState("");
  const [areaFiltro, setAreaFiltro] = useState<string>("todas");
  const [statusFiltro, setStatusFiltro] = useState<string>("todas");

  const filtradas = useMemo(() => {
    return tarefas.filter((t) => {
      if (areaFiltro !== "todas" && t.area !== areaFiltro) return false;
      if (statusFiltro !== "todas" && t.status !== statusFiltro) return false;
      if (filtro && !t.titulo.toLowerCase().includes(filtro.toLowerCase())) return false;
      return true;
    });
  }, [tarefas, filtro, areaFiltro, statusFiltro]);

  const grupos = useMemo(() => {
    const m = new Map<number, Tarefa[]>();
    filtradas.forEach((t) => {
      const arr = m.get(t.semana) ?? [];
      arr.push(t);
      m.set(t.semana, arr);
    });
    return Array.from(m.entries()).sort(([a], [b]) => a - b);
  }, [filtradas]);

  const stats = useMemo(() => {
    const total = tarefas.length;
    const concluidas = tarefas.filter((t) => t.status === "concluida").length;
    return { total, concluidas, pct: total ? Math.round((concluidas / total) * 100) : 0 };
  }, [tarefas]);

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando cronograma...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium">{stats.concluidas}/{stats.total} tarefas</span>
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">{stats.pct}% concluído</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <NovaTarefaDialog campanhaId={campanhaId} canManage={canManage} />
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar tarefa..." className="pl-7 h-8 w-48" />
          </div>
          <Select value={areaFiltro} onValueChange={setAreaFiltro}>
            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as áreas</SelectItem>
              {AREAS.map(a => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="atrasada">Atrasada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="h-[600px] pr-3">
        <div className="space-y-4">
          {grupos.map(([semana, ts]) => (
            <div key={semana}>
              <div className="flex items-center gap-2 mb-2">
                <CalIcon className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Semana {semana}</h3>
                <span className="text-xs text-muted-foreground">({ts.length} tarefas)</span>
              </div>
              <div className="space-y-1.5">
                {ts.map((t) => {
                  const concluida = t.status === "concluida";
                  return (
                    <Card key={t.id} className={concluida ? "bg-muted/30" : ""}>
                      <CardContent className="p-3 flex items-start gap-3">
                        <Checkbox
                          checked={concluida}
                          disabled={!canManage}
                          onCheckedChange={(checked) => {
                            update.mutate({
                              id: t.id,
                              status: checked ? "concluida" : "pendente",
                              data_conclusao: checked ? new Date().toISOString() : null,
                            });
                          }}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${concluida ? "line-through text-muted-foreground" : ""}`}>
                              {t.titulo}
                            </p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              Dia {t.dia} · {new Date(t.data_prevista).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                            <Badge variant="outline" className={`text-[10px] capitalize ${areaColors[t.area]}`}>{t.area}</Badge>
                            <Badge variant="outline" className={`text-[10px] capitalize ${prioColors[t.prioridade]}`}>{t.prioridade}</Badge>
                            <button
                              onClick={() => canManage && confirm(`Remover "${t.titulo}"?`) && remove.mutate(t.id)}
                              disabled={!canManage}
                              className="ml-auto text-muted-foreground hover:text-destructive p-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Remover tarefa"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
          {grupos.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">Nenhuma tarefa encontrada com os filtros atuais.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
