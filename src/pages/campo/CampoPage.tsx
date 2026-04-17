import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Route, Plus, MapPin, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors: Record<string, string> = {
  planejado: "bg-info/10 text-info border-info/30",
  em_andamento: "bg-warning/10 text-warning border-warning/30",
  concluido: "bg-success/10 text-success border-success/30",
  cancelado: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function CampoPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", data: new Date().toISOString().slice(0, 10), municipio_id: "", observacoes: "" });

  const { data: roteiros = [], isLoading } = useQuery({
    queryKey: ["roteiros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roteiros_visita")
        .select("*, municipios(nome), roteiros_paradas(id, concluido)")
        .order("data", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: municipios = [] } = useQuery({
    queryKey: ["municipios-campo"],
    queryFn: async () => {
      const { data } = await supabase.from("municipios").select("id, nome").order("nome").limit(500);
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("roteiros_visita").insert({
        nome: form.nome,
        data: form.data,
        municipio_id: form.municipio_id || null,
        observacoes: form.observacoes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roteiros"] });
      toast.success("Roteiro criado!");
      setOpen(false);
      setForm({ nome: "", data: new Date().toISOString().slice(0, 10), municipio_id: "", observacoes: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("roteiros_visita").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roteiros"] }),
  });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Route className="h-7 w-7 text-primary" />
              Campo · Roteiros de Visita
            </h1>
            <p className="text-muted-foreground mt-1">Planeje e acompanhe rotas de campo</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1"><Plus className="h-4 w-4" />Novo roteiro</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Roteiro de Visita</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Visita bairro Centro" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Data *</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
                  <div className="space-y-1.5">
                    <Label>Município</Label>
                    <Select value={form.municipio_id} onValueChange={(v) => setForm({ ...form, municipio_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{municipios.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button disabled={!form.nome || create.isPending} onClick={() => create.mutate()}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{roteiros.length}</div><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="p-4"><Clock className="h-4 w-4 text-warning mb-1" /><div className="text-2xl font-bold">{roteiros.filter((r: any) => r.status === "em_andamento").length}</div><p className="text-xs text-muted-foreground">Em andamento</p></CardContent></Card>
          <Card><CardContent className="p-4"><CheckCircle2 className="h-4 w-4 text-success mb-1" /><div className="text-2xl font-bold">{roteiros.filter((r: any) => r.status === "concluido").length}</div><p className="text-xs text-muted-foreground">Concluídos</p></CardContent></Card>
          <Card><CardContent className="p-4"><MapPin className="h-4 w-4 text-info mb-1" /><div className="text-2xl font-bold">{roteiros.reduce((a: number, r: any) => a + (r.roteiros_paradas?.length ?? 0), 0)}</div><p className="text-xs text-muted-foreground">Paradas totais</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Roteiros</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
            ) : roteiros.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum roteiro cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {roteiros.map((r: any) => {
                  const total = r.roteiros_paradas?.length ?? 0;
                  const concluidas = r.roteiros_paradas?.filter((p: any) => p.concluido).length ?? 0;
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/30 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{r.nome}</p>
                          <Badge variant="outline" className={statusColors[r.status]}>{r.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{format(new Date(r.data), "dd MMM yyyy", { locale: ptBR })}</span>
                          {r.municipios?.nome && <span>· {r.municipios.nome}</span>}
                          <span>· {concluidas}/{total} paradas</span>
                        </div>
                      </div>
                      <Select value={r.status} onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v })}>
                        <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planejado">Planejado</SelectItem>
                          <SelectItem value="em_andamento">Em andamento</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
