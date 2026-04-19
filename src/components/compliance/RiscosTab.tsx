import { useState } from "react";
import { useRiscos, useUpsertRisco, useDeleteRisco, type Risco } from "@/hooks/useCompliance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, ShieldAlert } from "lucide-react";

const CAT_LABEL: Record<Risco["categoria"], string> = {
  juridico: "Jurídico", reputacional: "Reputacional", financeiro: "Financeiro", operacional: "Operacional", eleitoral: "Eleitoral",
};
const SEV_VARIANT: Record<Risco["severidade"], "default" | "secondary" | "destructive" | "outline"> = {
  baixa: "outline", media: "secondary", alta: "default", critica: "destructive",
};
const STATUS_LABEL: Record<Risco["status"], string> = {
  identificado: "Identificado", em_mitigacao: "Em mitigação", mitigado: "Mitigado", aceito: "Aceito", materializado: "Materializado",
};

function RiscoForm({ risco, onClose }: { risco?: Risco; onClose: () => void }) {
  const upsert = useUpsertRisco();
  const [form, setForm] = useState({
    titulo: risco?.titulo || "",
    descricao: risco?.descricao || "",
    categoria: (risco?.categoria || "operacional") as Risco["categoria"],
    severidade: (risco?.severidade || "media") as Risco["severidade"],
    probabilidade: risco?.probabilidade || 3,
    impacto: risco?.impacto || 3,
    status: (risco?.status || "identificado") as Risco["status"],
    plano_mitigacao: risco?.plano_mitigacao || "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsert.mutateAsync({ ...(risco?.id ? { id: risco.id } : {}), ...form, descricao: form.descricao || null, plano_mitigacao: form.plano_mitigacao || null } as any);
    onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></div>
      <div><Label>Descrição</Label><Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Categoria</Label>
          <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as Risco["categoria"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(CAT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Severidade</Label>
          <Select value={form.severidade} onValueChange={(v) => setForm({ ...form, severidade: v as Risco["severidade"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["baixa","media","alta","critica"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Probabilidade (1-5)</Label><Input type="number" min={1} max={5} value={form.probabilidade} onChange={(e) => setForm({ ...form, probabilidade: Number(e.target.value) })} /></div>
        <div><Label>Impacto (1-5)</Label><Input type="number" min={1} max={5} value={form.impacto} onChange={(e) => setForm({ ...form, impacto: Number(e.target.value) })} /></div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Risco["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Plano de mitigação</Label><Textarea rows={3} value={form.plano_mitigacao} onChange={(e) => setForm({ ...form, plano_mitigacao: e.target.value })} /></div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={upsert.isPending}>{risco ? "Atualizar" : "Criar"}</Button>
      </div>
    </form>
  );
}

export function RiscosTab() {
  const { data: riscos = [], isLoading } = useRiscos();
  const del = useDeleteRisco();
  const [editing, setEditing] = useState<Risco | undefined>();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /> Matriz de Riscos</h3>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(undefined); }}>
          <DialogTrigger asChild><Button size="sm" onClick={() => setEditing(undefined)}><Plus className="h-4 w-4 mr-1" /> Novo risco</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Editar risco" : "Novo risco"}</DialogTitle></DialogHeader>
            <RiscoForm risco={editing} onClose={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : riscos.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum risco registrado.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {riscos.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold truncate">{r.titulo}</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">{CAT_LABEL[r.categoria]}</Badge>
                      <Badge variant={SEV_VARIANT[r.severidade]} className="text-[10px]">{r.severidade}</Badge>
                      <Badge variant="secondary" className="text-[10px]">P{r.probabilidade}×I{r.impacto}={r.probabilidade * r.impacto}</Badge>
                      <Badge variant="outline" className="text-[10px]">{STATUS_LABEL[r.status]}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Excluir risco?")) del.mutate(r.id); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                {r.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{r.descricao}</p>}
                {r.plano_mitigacao && <p className="text-xs"><span className="font-medium">Mitigação: </span>{r.plano_mitigacao}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
