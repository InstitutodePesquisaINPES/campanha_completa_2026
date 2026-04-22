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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Search, Calendar as CalIcon, Plus, Trash2, Paperclip, LayoutGrid, List,
  Flag, ShieldCheck, ShieldAlert, Filter, X, GripVertical, ArrowRight,
} from "lucide-react";
import { TarefaDetailDrawer } from "./TarefaDetailDrawer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

type ColKey = "pendente" | "em_andamento" | "concluida" | "atrasada";
const KANBAN_COLS: { key: ColKey; label: string; tone: string; head: string }[] = [
  { key: "pendente",     label: "A fazer",      tone: "border-muted",          head: "bg-muted/40" },
  { key: "em_andamento", label: "Em andamento", tone: "border-info/40",        head: "bg-info/10" },
  { key: "concluida",    label: "Concluída",    tone: "border-success/40",     head: "bg-success/10" },
  { key: "atrasada",     label: "Atrasada",     tone: "border-destructive/40", head: "bg-destructive/10" },
];

type TarefaExt = Tarefa & {
  is_marco?: boolean | null;
  fase_legal?: string | null;
  permitido_antes_registro?: boolean | null;
  responsavel_papel?: string | null;
};

function useAnexosCount(campanhaId: string) {
  return useQuery({
    queryKey: ["tarefa-anexos-count", campanhaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanha_tarefa_anexos" as never)
        .select("tarefa_id")
        .eq("campanha_id", campanhaId);
      if (error) throw error;
      const map = new Map<string, number>();
      (data ?? []).forEach((r: { tarefa_id: string }) => {
        map.set(r.tarefa_id, (map.get(r.tarefa_id) ?? 0) + 1);
      });
      return map;
    },
  });
}

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
            <div><Label>Dia</Label><Input type="number" min={1} value={form.dia} onChange={(e) => setForm({ ...form, dia: +e.target.value })} /></div>
            <div><Label>Semana</Label><Input type="number" min={1} value={form.semana} onChange={(e) => setForm({ ...form, semana: +e.target.value })} /></div>
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

function TarefaCard({
  t, anexos, onOpen, onToggle, canManage, onRemove, onMove, draggable,
}: {
  t: Tarefa; anexos: number; onOpen: () => void;
  onToggle: (concluida: boolean) => void; canManage: boolean;
  onRemove: () => void; onMove?: (status: ColKey) => void; draggable?: boolean;
}) {
  const tx = t as TarefaExt;
  const concluida = t.status === "concluida";
  const isMarco = !!tx.is_marco;
  const atrasada = t.status === "atrasada" || (t.status !== "concluida" && new Date(t.data_prevista) < new Date(new Date().toDateString()));

  return (
    <Card
      draggable={draggable && canManage}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; }}
      className={`group cursor-pointer hover:shadow-md transition ${concluida ? "bg-muted/30" : ""} ${isMarco ? "border-l-4 border-l-warning" : ""} ${atrasada && !concluida ? "ring-1 ring-destructive/30" : ""}`}
    >
      <CardContent className="p-2.5 flex items-start gap-2">
        {draggable && canManage && (
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0 group-hover:text-muted-foreground" />
        )}
        <Checkbox
          checked={concluida}
          disabled={!canManage}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={(c) => onToggle(!!c)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0" onClick={onOpen}>
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium leading-snug flex items-center gap-1.5 ${concluida ? "line-through text-muted-foreground" : ""}`}>
              {isMarco && <Flag className="h-3.5 w-3.5 text-warning shrink-0" />}
              <span className="line-clamp-2">{t.titulo}</span>
            </p>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
              D{t.dia} · S{t.semana}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {new Date(t.data_prevista).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5 items-center">
            <Badge variant="outline" className={`text-[10px] capitalize ${areaColors[t.area]}`}>{t.area}</Badge>
            <Badge variant="outline" className={`text-[10px] capitalize ${prioColors[t.prioridade]}`}>{t.prioridade}</Badge>
            {tx.fase_legal === "campanha_oficial" ? (
              <Badge variant="outline" className="text-[10px] gap-0.5 bg-warning/10 text-warning border-warning/30" title="Apenas após registro TSE">
                <ShieldAlert className="h-2.5 w-2.5" />pós-registro
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] gap-0.5 bg-info/10 text-info border-info/30" title="Legal na pré-campanha">
                <ShieldCheck className="h-2.5 w-2.5" />pré
              </Badge>
            )}
            {anexos > 0 && (
              <Badge variant="outline" className="text-[10px] gap-0.5"><Paperclip className="h-2.5 w-2.5" />{anexos}</Badge>
            )}
            {tx.responsavel_papel && (
              <Badge variant="outline" className="text-[10px] truncate max-w-[120px]" title={tx.responsavel_papel}>
                {tx.responsavel_papel}
              </Badge>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); if (canManage && confirm(`Remover "${t.titulo}"?`)) onRemove(); }}
              disabled={!canManage}
              className="ml-auto text-muted-foreground hover:text-destructive p-0.5 disabled:opacity-40 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transition"
              title="Remover tarefa"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          {onMove && canManage && (
            <div className="hidden group-hover:flex gap-1 mt-1.5">
              {KANBAN_COLS.filter(c => c.key !== t.status).map(c => (
                <button
                  key={c.key}
                  onClick={(e) => { e.stopPropagation(); onMove(c.key); }}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:bg-accent flex items-center gap-0.5"
                  title={`Mover para ${c.label}`}
                >
                  <ArrowRight className="h-2.5 w-2.5" />{c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CronogramaTarefas({ campanhaId }: { campanhaId: string }) {
  const { data: tarefas = [], isLoading } = useTarefas(campanhaId);
  const { data: anexosMap } = useAnexosCount(campanhaId);
  const canManage = useCanManage();
  const update = useUpdateTarefa();
  const remove = useDeleteTarefa();
  const [filtro, setFiltro] = useState("");
  const [areaFiltro, setAreaFiltro] = useState<string>("todas");
  const [statusFiltro, setStatusFiltro] = useState<string>("todas");
  const [semanaFiltro, setSemanaFiltro] = useState<string>("todas");
  const [faseFiltro, setFaseFiltro] = useState<string>("todas");
  const [prioFiltro, setPrioFiltro] = useState<string>("todas");
  const [marcoFiltro, setMarcoFiltro] = useState<string>("todas"); // todas | marcos | tarefas
  const [responsavelFiltro, setResponsavelFiltro] = useState<string>("todos");
  const [agruparPor, setAgruparPor] = useState<"semana" | "fase" | "area" | "responsavel">("semana");
  const [selected, setSelected] = useState<Tarefa | null>(null);

  const semanasDisponiveis = useMemo(
    () => Array.from(new Set(tarefas.map(t => t.semana))).sort((a, b) => a - b),
    [tarefas]
  );
  const responsaveisDisponiveis = useMemo(
    () => Array.from(new Set(tarefas.map(t => (t as TarefaExt).responsavel_papel).filter(Boolean) as string[])).sort(),
    [tarefas]
  );

  const filtradas = useMemo(() => {
    return tarefas.filter((t) => {
      const tx = t as TarefaExt;
      if (areaFiltro !== "todas" && t.area !== areaFiltro) return false;
      if (statusFiltro !== "todas" && t.status !== statusFiltro) return false;
      if (semanaFiltro !== "todas" && String(t.semana) !== semanaFiltro) return false;
      if (faseFiltro !== "todas" && (tx.fase_legal ?? "pre_campanha_legal") !== faseFiltro) return false;
      if (prioFiltro !== "todas" && t.prioridade !== prioFiltro) return false;
      if (marcoFiltro === "marcos" && !tx.is_marco) return false;
      if (marcoFiltro === "tarefas" && tx.is_marco) return false;
      if (responsavelFiltro !== "todos" && tx.responsavel_papel !== responsavelFiltro) return false;
      if (filtro) {
        const q = filtro.toLowerCase();
        if (!t.titulo.toLowerCase().includes(q) && !(t.descricao ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tarefas, filtro, areaFiltro, statusFiltro, semanaFiltro, faseFiltro, prioFiltro, marcoFiltro, responsavelFiltro]);

  const filtrosAtivos = [
    areaFiltro !== "todas", statusFiltro !== "todas", semanaFiltro !== "todas",
    faseFiltro !== "todas", prioFiltro !== "todas", marcoFiltro !== "todas",
    responsavelFiltro !== "todos", !!filtro,
  ].filter(Boolean).length;

  const limparFiltros = () => {
    setFiltro(""); setAreaFiltro("todas"); setStatusFiltro("todas"); setSemanaFiltro("todas");
    setFaseFiltro("todas"); setPrioFiltro("todas"); setMarcoFiltro("todas"); setResponsavelFiltro("todos");
  };

  const grupos = useMemo(() => {
    const m = new Map<string, Tarefa[]>();
    filtradas.forEach((t) => {
      const tx = t as TarefaExt;
      const key =
        agruparPor === "semana" ? `Semana ${t.semana}` :
        agruparPor === "fase" ? (tx.fase_legal === "campanha_oficial" ? "Campanha oficial (pós-registro TSE)" : "Pré-campanha (legal)") :
        agruparPor === "area" ? t.area :
        (tx.responsavel_papel ?? "Sem responsável");
      const arr = m.get(key) ?? [];
      arr.push(t);
      m.set(key, arr);
    });
    return Array.from(m.entries()).sort(([a], [b]) => {
      if (agruparPor === "semana") {
        return parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, ""));
      }
      return a.localeCompare(b);
    });
  }, [filtradas, agruparPor]);

  const stats = useMemo(() => {
    const total = filtradas.length;
    const concluidas = filtradas.filter((t) => t.status === "concluida").length;
    const emAndamento = filtradas.filter((t) => t.status === "em_andamento").length;
    const atrasadas = filtradas.filter((t) => t.status === "atrasada").length;
    const marcos = filtradas.filter((t) => (t as TarefaExt).is_marco).length;
    return { total, concluidas, emAndamento, atrasadas, marcos, pct: total ? Math.round((concluidas / total) * 100) : 0 };
  }, [filtradas]);

  const toggle = (t: Tarefa, concluida: boolean) => {
    update.mutate({
      id: t.id,
      status: concluida ? "concluida" : "pendente",
      data_conclusao: concluida ? new Date().toISOString() : null,
    });
  };

  const moveStatus = (t: Tarefa, status: ColKey) => {
    update.mutate({
      id: t.id,
      status,
      data_conclusao: status === "concluida" ? new Date().toISOString() : null,
    });
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando cronograma...</div>;

  // Barra de filtros (compartilhada)
  const filterBar = (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar título ou descrição..." className="pl-7 h-8" />
      </div>
      <Select value={semanaFiltro} onValueChange={setSemanaFiltro}>
        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas semanas</SelectItem>
          {semanasDisponiveis.map(s => <SelectItem key={s} value={String(s)}>Semana {s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={faseFiltro} onValueChange={setFaseFiltro}>
        <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as fases</SelectItem>
          <SelectItem value="pre_campanha_legal">Pré-campanha</SelectItem>
          <SelectItem value="campanha_oficial">Campanha oficial</SelectItem>
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3.5 w-3.5" />Mais filtros
            {filtrosAtivos > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{filtrosAtivos}</Badge>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 space-y-3">
          <div>
            <Label className="text-xs">Área</Label>
            <Select value={areaFiltro} onValueChange={setAreaFiltro}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {AREAS.map(a => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos</SelectItem>
                <SelectItem value="pendente">A fazer</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="atrasada">Atrasada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Prioridade</Label>
            <Select value={prioFiltro} onValueChange={setPrioFiltro}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {PRIORIDADES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={marcoFiltro} onValueChange={setMarcoFiltro}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos</SelectItem>
                <SelectItem value="marcos">Apenas marcos</SelectItem>
                <SelectItem value="tarefas">Apenas tarefas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {responsaveisDisponiveis.length > 0 && (
            <div>
              <Label className="text-xs">Responsável</Label>
              <Select value={responsavelFiltro} onValueChange={setResponsavelFiltro}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {responsaveisDisponiveis.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {filtrosAtivos > 0 && (
        <Button size="sm" variant="ghost" onClick={limparFiltros} className="h-8 gap-1 text-muted-foreground">
          <X className="h-3.5 w-3.5" />Limpar
        </Button>
      )}
      <NovaTarefaDialog campanhaId={campanhaId} canManage={canManage} />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Card><CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Total filtrado</div>
          <div className="text-xl font-bold">{stats.total}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Concluídas</div>
          <div className="text-xl font-bold text-success">{stats.concluidas} <span className="text-xs text-muted-foreground">({stats.pct}%)</span></div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Em andamento</div>
          <div className="text-xl font-bold text-info">{stats.emAndamento}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Atrasadas</div>
          <div className="text-xl font-bold text-destructive">{stats.atrasadas}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-xs text-muted-foreground">Marcos</div>
          <div className="text-xl font-bold text-warning flex items-center gap-1"><Flag className="h-4 w-4" />{stats.marcos}</div>
        </CardContent></Card>
      </div>

      {filterBar}

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban" className="gap-1"><LayoutGrid className="h-3.5 w-3.5" />Kanban</TabsTrigger>
          <TabsTrigger value="lista" className="gap-1"><List className="h-3.5 w-3.5" />Lista agrupada</TabsTrigger>
        </TabsList>

        {/* KANBAN ROBUSTO */}
        <TabsContent value="kanban" className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Arraste cards entre colunas para mudar o status. Hover no card para ações rápidas.</span>
          </div>
          <ScrollArea className="h-[640px]">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 min-w-[900px]">
              {KANBAN_COLS.map((col) => {
                const items = filtradas.filter((t) => t.status === col.key);
                const marcos = items.filter(t => (t as TarefaExt).is_marco).length;
                return (
                  <div
                    key={col.key}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData("text/plain");
                      const t = tarefas.find(x => x.id === id);
                      if (t && t.status !== col.key && canManage) moveStatus(t, col.key);
                    }}
                    className={`rounded-lg border-2 ${col.tone} bg-card flex flex-col`}
                  >
                    <div className={`flex items-center justify-between px-3 py-2 rounded-t-md ${col.head}`}>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{col.label}</h4>
                        <Badge variant="outline" className="text-[10px] bg-background">{items.length}</Badge>
                      </div>
                      {marcos > 0 && (
                        <Badge variant="outline" className="text-[10px] gap-0.5 bg-warning/10 text-warning border-warning/30">
                          <Flag className="h-2.5 w-2.5" />{marcos}
                        </Badge>
                      )}
                    </div>
                    <div className="p-2 space-y-1.5 min-h-[120px] flex-1">
                      {items
                        .sort((a, b) => {
                          // marcos primeiro, depois por dia
                          const am = (a as TarefaExt).is_marco ? 0 : 1;
                          const bm = (b as TarefaExt).is_marco ? 0 : 1;
                          if (am !== bm) return am - bm;
                          return a.dia - b.dia;
                        })
                        .map((t) => (
                          <TarefaCard
                            key={t.id}
                            t={t}
                            anexos={anexosMap?.get(t.id) ?? 0}
                            canManage={canManage}
                            draggable
                            onOpen={() => setSelected(t)}
                            onToggle={(c) => toggle(t, c)}
                            onRemove={() => remove.mutate(t.id)}
                            onMove={(s) => moveStatus(t, s)}
                          />
                        ))}
                      {items.length === 0 && (
                        <p className="text-[11px] text-muted-foreground text-center py-8 border border-dashed rounded">
                          Solte tarefas aqui
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* LISTA AGRUPADA */}
        <TabsContent value="lista" className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Agrupar por:</Label>
            <Select value={agruparPor} onValueChange={(v: typeof agruparPor) => setAgruparPor(v)}>
              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="fase">Fase legal</SelectItem>
                <SelectItem value="area">Área</SelectItem>
                <SelectItem value="responsavel">Responsável</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="h-[600px] pr-3">
            <div className="space-y-4">
              {grupos.map(([grupo, ts]) => {
                const concl = ts.filter(t => t.status === "concluida").length;
                return (
                  <div key={grupo}>
                    <div className="flex items-center gap-2 mb-2 sticky top-0 bg-background/95 backdrop-blur py-1.5 z-10">
                      <CalIcon className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold capitalize">{grupo}</h3>
                      <Badge variant="outline" className="text-[10px]">{ts.length} tarefas</Badge>
                      <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30">
                        {concl}/{ts.length} ok
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {ts.map((t) => (
                        <TarefaCard
                          key={t.id}
                          t={t}
                          anexos={anexosMap?.get(t.id) ?? 0}
                          canManage={canManage}
                          onOpen={() => setSelected(t)}
                          onToggle={(c) => toggle(t, c)}
                          onRemove={() => remove.mutate(t.id)}
                          onMove={(s) => moveStatus(t, s)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {grupos.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-12">
                  Nenhuma tarefa encontrada com os filtros atuais.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <TarefaDetailDrawer
        tarefa={selected}
        open={!!selected}
        onOpenChange={(v) => { if (!v) setSelected(null); }}
        canManage={canManage}
      />
    </div>
  );
}
