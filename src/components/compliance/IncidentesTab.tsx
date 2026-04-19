import { useState } from "react";
import { useIncidentes, useUpsertIncidente, useDeleteIncidente, type Incidente } from "@/hooks/useCompliance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, AlertOctagon } from "lucide-react";
import { format } from "date-fns";

const CAT_LABEL = { juridico: "Jurídico", reputacional: "Reputacional", financeiro: "Financeiro", operacional: "Operacional", eleitoral: "Eleitoral" } as const;
const STATUS_VARIANT: Record<Incidente["status"], "default" | "secondary" | "destructive" | "outline"> = {
  aberto: "destructive", em_apuracao: "default", resolvido: "secondary", arquivado: "outline",
};

function IncForm({ inc, onClose }: { inc?: Incidente; onClose: () => void }) {
  const upsert = useUpsertIncidente();
  const [form, setForm] = useState({
    titulo: inc?.titulo || "",
    descricao: inc?.descricao || "",
    categoria: (inc?.categoria || "operacional") as Incidente["categoria"],
    severidade: (inc?.severidade || "media") as Incidente["severidade"],
    status: (inc?.status || "aberto") as Incidente["status"],
    data_ocorrencia: inc?.data_ocorrencia ? format(new Date(inc.data_ocorrencia), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    acoes_tomadas: inc?.acoes_tomadas || "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsert.mutateAsync({
      ...(inc?.id ? { id: inc.id } : {}),
      titulo: form.titulo,
      descricao: form.descricao || null,
      categoria: form.categoria,
      severidade: form.severidade,
      status: form.status,
      data_ocorrencia: new Date(form.data_ocorrencia).toISOString(),
      acoes_tomadas: form.acoes_tomadas || null,
      data_resolucao: form.status === "resolvido" ? new Date().toISOString() : null,
    } as any);
    onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></div>
      <div><Label>Descrição</Label><Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Categoria</Label>
          <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as Incidente["categoria"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(CAT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Severidade</Label>
          <Select value={form.severidade} onValueChange={(v) => setForm({ ...form, severidade: v as Incidente["severidade"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["baixa","media","alta","critica"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Incidente["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["aberto","em_apuracao","resolvido","arquivado"].map((s) => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Data da ocorrência</Label><Input type="datetime-local" value={form.data_ocorrencia} onChange={(e) => setForm({ ...form, data_ocorrencia: e.target.value })} /></div>
      <div><Label>Ações tomadas</Label><Textarea rows={3} value={form.acoes_tomadas} onChange={(e) => setForm({ ...form, acoes_tomadas: e.target.value })} /></div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={upsert.isPending}>{inc ? "Atualizar" : "Registrar"}</Button>
      </div>
    </form>
  );
}

export function IncidentesTab() {
  const { data: incs = [], isLoading } = useIncidentes();
  const del = useDeleteIncidente();
  const [editing, setEditing] = useState<Incidente | undefined>();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2"><AlertOctagon className="h-5 w-5 text-primary" /> Incidentes</h3>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(undefined); }}>
          <DialogTrigger asChild><Button size="sm" onClick={() => setEditing(undefined)}><Plus className="h-4 w-4 mr-1" /> Novo incidente</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Editar incidente" : "Registrar incidente"}</DialogTitle></DialogHeader>
            <IncForm inc={editing} onClose={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : incs.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum incidente registrado.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {incs.map((i) => (
            <Card key={i.id}>
              <CardContent className="py-3 flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{i.titulo}</p>
                    <Badge variant={STATUS_VARIANT[i.status]} className="text-[10px]">{i.status.replace("_"," ")}</Badge>
                    <Badge variant="outline" className="text-[10px]">{CAT_LABEL[i.categoria]}</Badge>
                    <Badge variant="outline" className="text-[10px]">{i.severidade}</Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(i.data_ocorrencia), "dd/MM/yy HH:mm")}</span>
                  </div>
                  {i.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{i.descricao}</p>}
                  {i.acoes_tomadas && <p className="text-xs"><span className="font-medium">Ações: </span>{i.acoes_tomadas}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(i); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Excluir incidente?")) del.mutate(i.id); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
