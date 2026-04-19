import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarDays, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { useCreateDeliberacao, useCreateReuniao, useDeliberacoes, useReunioes, useToggleDeliberacao } from "@/hooks/useComando";

export function ReunioesPanel() {
  const { data: reunioes = [], isLoading } = useReunioes();
  const [open, setOpen] = useState(false);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [form, setForm] = useState({ titulo: "", data_reuniao: "", local: "", pauta: "" });
  const createReuniao = useCreateReuniao();

  const handleCreate = async () => {
    if (!form.titulo || !form.data_reuniao) return;
    await createReuniao.mutateAsync(form);
    setForm({ titulo: "", data_reuniao: "", local: "", pauta: "" });
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Reuniões executivas</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />Nova</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova reunião</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
              <Input type="datetime-local" value={form.data_reuniao} onChange={(e) => setForm({ ...form, data_reuniao: e.target.value })} />
              <Input placeholder="Local" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
              <Textarea placeholder="Pauta" rows={4} value={form.pauta} onChange={(e) => setForm({ ...form, pauta: e.target.value })} />
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createReuniao.isPending}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {!isLoading && reunioes.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma reunião registrada ainda.</p>
        )}
        {reunioes.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelecionada(selecionada === r.id ? null : r.id)}
            className="w-full rounded-md border border-border p-3 text-left transition-colors hover:bg-accent"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <p className="truncate font-medium">{r.titulo}</p>
                  <Badge variant="outline" className="text-xs">{r.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(r.data_reuniao).toLocaleString("pt-BR")} {r.local ? `• ${r.local}` : ""}
                </p>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform ${selecionada === r.id ? "rotate-90" : ""}`} />
            </div>
            {selecionada === r.id && <DeliberacoesList reuniaoId={r.id} pauta={r.pauta} />}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function DeliberacoesList({ reuniaoId, pauta }: { reuniaoId: string; pauta?: string }) {
  const { data: items = [] } = useDeliberacoes(reuniaoId);
  const create = useCreateDeliberacao();
  const toggle = useToggleDeliberacao();
  const [desc, setDesc] = useState("");
  const [prazo, setPrazo] = useState("");

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
      {pauta && <p className="text-xs text-muted-foreground whitespace-pre-wrap"><strong>Pauta:</strong> {pauta}</p>}
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deliberações</p>
      <div className="space-y-1.5">
        {items.map((d) => (
          <div key={d.id} className="flex items-start gap-2 text-sm">
            <button
              onClick={() => toggle.mutate({ id: d.id, status: d.status === "concluida" ? "pendente" : "concluida" })}
              className="mt-0.5"
            >
              {d.status === "concluida" ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <div className="flex-1">
              <p className={d.status === "concluida" ? "line-through text-muted-foreground" : ""}>{d.descricao}</p>
              {d.prazo && <p className="text-xs text-muted-foreground">Prazo: {new Date(d.prazo).toLocaleDateString("pt-BR")}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <Input placeholder="Nova deliberação" value={desc} onChange={(e) => setDesc(e.target.value)} className="text-sm" />
        <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="w-40 text-sm" />
        <Button
          size="sm"
          onClick={async () => {
            if (!desc) return;
            await create.mutateAsync({ reuniao_id: reuniaoId, descricao: desc, prazo: prazo || undefined });
            setDesc("");
            setPrazo("");
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
