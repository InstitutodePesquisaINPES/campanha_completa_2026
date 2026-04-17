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
import { FileText, Upload, Download, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const tipos = ["proposta", "contrato", "ata", "comprovante", "oficio", "midia", "outros"];

export default function DocumentosPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [form, setForm] = useState({ titulo: "", tipo: "outros", descricao: "", file: null as File | null });

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["documentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pessoas_anexos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!form.file) throw new Error("Selecione um arquivo");
      const ext = form.file.name.split(".").pop();
      const path = `documentos/${user?.id}/${Date.now()}-${form.titulo.replace(/[^a-z0-9]/gi, "_")}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documentos").upload(path, form.file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("documentos").getPublicUrl(path);
      const { error } = await supabase.from("pessoas_anexos").insert({
        pessoa_id: user?.id || "",
        arquivo_url: publicUrl,
        tipo_documento: form.tipo,
        descricao: `${form.titulo}${form.descricao ? " · " + form.descricao : ""}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentos"] });
      toast.success("Documento enviado!");
      setOpen(false);
      setForm({ titulo: "", tipo: "outros", descricao: "", file: null });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pessoas_anexos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentos"] });
      toast.success("Removido");
    },
  });

  const filtrados = docs.filter((d: any) => {
    if (tipoFiltro !== "todos" && d.tipo_documento !== tipoFiltro) return false;
    if (filtro && !d.descricao?.toLowerCase().includes(filtro.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-7 w-7 text-primary" />
              Documentos
            </h1>
            <p className="text-muted-foreground mt-1">Repositório central de arquivos da campanha</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1"><Upload className="h-4 w-4" />Enviar documento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Documento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{tipos.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Arquivo *</Label><Input type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button disabled={!form.titulo || !form.file || upload.isPending} onClick={() => upload.mutate()}>{upload.isPending ? "Enviando..." : "Enviar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <CardTitle className="text-base">{filtrados.length} documento(s)</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar..." className="pl-7 h-8 w-48" />
                </div>
                <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                  <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {tipos.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
            ) : filtrados.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum documento encontrado.</p>
            ) : (
              <div className="space-y-2">
                {filtrados.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{d.descricao || "Sem título"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Badge variant="outline" className="capitalize text-[10px]">{d.tipo_documento || "outros"}</Badge>
                          <span>{format(new Date(d.created_at), "dd/MM/yyyy HH:mm")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" asChild><a href={d.arquivo_url} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /></a></Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) remove.mutate(d.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
