import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Trash2, Megaphone } from "lucide-react";

const CARGOS = ["prefeito", "vice_prefeito", "vereador", "deputado_estadual", "deputado_federal", "senador", "governador", "vice_governador", "presidente"];

export function CampanhasTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "", cargo: "vereador", data_eleicao: "", data_inicio_plano: new Date().toISOString().slice(0,10),
    partido_sigla: "", numero_urna: "", meta_votos: "", orcamento_total: "",
  });

  const { data: campanhas = [], isLoading } = useQuery({
    queryKey: ["admin-campanhas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campanhas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = {
        nome: form.nome, cargo: form.cargo as any, data_eleicao: form.data_eleicao,
        data_inicio_plano: form.data_inicio_plano,
        partido_sigla: form.partido_sigla || null, numero_urna: form.numero_urna || null,
        meta_votos: form.meta_votos ? Number(form.meta_votos) : null,
        orcamento_total: form.orcamento_total ? Number(form.orcamento_total) : 0,
      };
      const { data, error } = await supabase.from("campanhas").insert(payload).select().single();
      if (error) throw error;
      const { error: rpcErr } = await supabase.rpc("gerar_plano_90_dias" as never, { _campanha_id: data.id } as never);
      if (rpcErr) throw rpcErr;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-campanhas"] });
      toast.success("Campanha criada com plano 90 dias!");
      setOpen(false);
      setForm({ nome: "", cargo: "vereador", data_eleicao: "", data_inicio_plano: new Date().toISOString().slice(0,10), partido_sigla: "", numero_urna: "", meta_votos: "", orcamento_total: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleAtiva = useMutation({
    mutationFn: async ({ id, ativa }: { id: string; ativa: boolean }) => {
      const { error } = await supabase.from("campanhas").update({ ativa }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-campanhas"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const regerar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("gerar_plano_90_dias" as never, { _campanha_id: id } as never);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Plano 90 dias regenerado"),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campanhas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-campanhas"] });
      toast.success("Campanha removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" />Campanhas ({campanhas.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova campanha</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cargo *</Label>
                  <Select value={form.cargo} onValueChange={(v) => setForm({ ...form, cargo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CARGOS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Partido</Label><Input value={form.partido_sigla} onChange={(e) => setForm({ ...form, partido_sigla: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Data eleição *</Label><Input type="date" value={form.data_eleicao} onChange={(e) => setForm({ ...form, data_eleicao: e.target.value })} /></div>
                <div><Label>Início plano</Label><Input type="date" value={form.data_inicio_plano} onChange={(e) => setForm({ ...form, data_inicio_plano: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Nº urna</Label><Input value={form.numero_urna} onChange={(e) => setForm({ ...form, numero_urna: e.target.value })} /></div>
                <div><Label>Meta votos</Label><Input type="number" value={form.meta_votos} onChange={(e) => setForm({ ...form, meta_votos: e.target.value })} /></div>
                <div><Label>Orçamento R$</Label><Input type="number" value={form.orcamento_total} onChange={(e) => setForm({ ...form, orcamento_total: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => create.mutate()} disabled={!form.nome || !form.data_eleicao || create.isPending}>
                {create.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Criar + Plano 90d
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : campanhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma campanha cadastrada.</p>
        ) : (
          <div className="space-y-2">
            {campanhas.map((c: any) => (
              <div key={c.id} className="border rounded-md p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{c.nome}</span>
                    <Badge variant="outline">{c.cargo}</Badge>
                    {c.partido_sigla && <Badge variant="secondary">{c.partido_sigla}{c.numero_urna ? ` ${c.numero_urna}` : ""}</Badge>}
                    {c.ativa && <Badge className="bg-green-500/10 text-green-600">ativa</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Eleição: {new Date(c.data_eleicao).toLocaleDateString("pt-BR")} · Meta: {c.meta_votos?.toLocaleString("pt-BR") ?? "—"} votos · Orç: R$ {Number(c.orcamento_total ?? 0).toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-xs">
                    <Switch checked={c.ativa} onCheckedChange={(v) => toggleAtiva.mutate({ id: c.id, ativa: v })} />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => regerar.mutate(c.id)} disabled={regerar.isPending} title="Regerar plano 90 dias">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => confirm(`Remover "${c.nome}"?`) && remove.mutate(c.id)} className="text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
