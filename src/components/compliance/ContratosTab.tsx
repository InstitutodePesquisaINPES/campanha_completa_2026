import { useState } from "react";
import { useContratos, useContratosAlerta, useUpsertContrato, useDeleteContrato, type Contrato } from "@/hooks/useCompliance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Plus, Trash2, Pencil, FileText } from "lucide-react";
import { format } from "date-fns";

const STATUS_VARIANT: Record<Contrato["status"], "default" | "secondary" | "outline" | "destructive"> = {
  rascunho: "outline",
  vigente: "default",
  encerrado: "secondary",
  cancelado: "destructive",
  vencido: "destructive",
};

const STATUS_LABEL: Record<Contrato["status"], string> = {
  rascunho: "Rascunho",
  vigente: "Vigente",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
  vencido: "Vencido",
};

function ContratoForm({ contrato, onClose }: { contrato?: Contrato; onClose: () => void }) {
  const upsert = useUpsertContrato();
  const [form, setForm] = useState({
    objeto: contrato?.objeto || "",
    numero: contrato?.numero || "",
    valor: contrato?.valor?.toString() || "0",
    data_inicio: contrato?.data_inicio || format(new Date(), "yyyy-MM-dd"),
    data_fim: contrato?.data_fim || format(new Date(), "yyyy-MM-dd"),
    status: (contrato?.status || "rascunho") as Contrato["status"],
    observacoes: contrato?.observacoes || "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsert.mutateAsync({
      ...(contrato?.id ? { id: contrato.id } : {}),
      objeto: form.objeto,
      numero: form.numero || null,
      valor: Number(form.valor),
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
      status: form.status,
      observacoes: form.observacoes || null,
    } as any);
    onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Objeto *</Label>
        <Input value={form.objeto} onChange={(e) => setForm({ ...form, objeto: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Número</Label>
          <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
        </div>
        <div>
          <Label>Valor (R$)</Label>
          <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Início *</Label>
          <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} required />
        </div>
        <div>
          <Label>Fim *</Label>
          <Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} required />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Contrato["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Observações</Label>
        <Textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={upsert.isPending}>{contrato ? "Atualizar" : "Criar"}</Button>
      </div>
    </form>
  );
}

export function ContratosTab() {
  const { data: contratos = [], isLoading } = useContratos();
  const { data: alertas = [] } = useContratosAlerta();
  const del = useDeleteContrato();
  const [editing, setEditing] = useState<Contrato | undefined>();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      {alertas.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {alertas.length} contrato(s) vencendo em até 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            {alertas.slice(0, 5).map((a) => (
              <div key={a.id} className="flex justify-between">
                <span className="truncate">{a.objeto}</span>
                <span className="font-mono shrink-0 ml-2">{a.dias_para_vencer}d</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Contratos</h3>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(undefined); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing(undefined)}><Plus className="h-4 w-4 mr-1" /> Novo contrato</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Editar contrato" : "Novo contrato"}</DialogTitle></DialogHeader>
            <ContratoForm contrato={editing} onClose={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objeto</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Carregando...</TableCell></TableRow>
              ) : contratos.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nenhum contrato cadastrado.</TableCell></TableRow>
              ) : contratos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium max-w-xs truncate">{c.objeto}</TableCell>
                  <TableCell className="font-mono text-xs">{c.numero || "—"}</TableCell>
                  <TableCell>{Number(c.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell className="text-xs">{format(new Date(c.data_inicio), "dd/MM/yy")} → {format(new Date(c.data_fim), "dd/MM/yy")}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge></TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Excluir contrato?")) del.mutate(c.id); }}><Trash2 className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
