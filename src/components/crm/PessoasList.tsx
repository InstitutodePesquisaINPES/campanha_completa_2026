import { useState } from "react";
import { usePessoas, useCreatePessoa, useDeletePessoa } from "@/hooks/usePessoas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Search, Eye } from "lucide-react";

const nivelColors: Record<string, string> = {
  desconhecido: "bg-gray-500/15 text-gray-400",
  frio: "bg-blue-500/15 text-blue-400",
  morno: "bg-yellow-500/15 text-yellow-400",
  quente: "bg-orange-500/15 text-orange-400",
  aliado: "bg-green-500/15 text-green-400",
  lideranca: "bg-purple-500/15 text-purple-400",
};

const nivelLabels: Record<string, string> = {
  desconhecido: "Desconhecido",
  frio: "Frio",
  morno: "Morno",
  quente: "Quente",
  aliado: "Aliado",
  lideranca: "Liderança",
};

type NivelRelacionamento = "desconhecido" | "frio" | "morno" | "quente" | "aliado" | "lideranca";

export function PessoasList({ onSelect }: { onSelect: (id: string) => void }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [nivelFilter, setNivelFilter] = useState<string>("all");
  const { data: pessoas = [], isLoading } = usePessoas(search || undefined, nivelFilter !== "all" ? nivelFilter : undefined);
  const createPessoa = useCreatePessoa();
  const deletePessoa = useDeletePessoa();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", cpf: "", genero: "", nivel_relacionamento: "desconhecido" as NivelRelacionamento });

  const handleCreate = async () => {
    if (!form.full_name.trim()) { toast({ variant: "destructive", title: "Informe o nome" }); return; }
    try {
      const p = await createPessoa.mutateAsync({
        full_name: form.full_name.trim(),
        cpf: form.cpf || undefined,
        genero: form.genero || undefined,
        nivel_relacionamento: form.nivel_relacionamento,
      });
      toast({ title: "Pessoa cadastrada!" });
      setOpen(false);
      setForm({ full_name: "", cpf: "", genero: "", nivel_relacionamento: "desconhecido" });
      onSelect(p.id);
    } catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); }
  };

  const maskCpf = (cpf: string | null) => {
    if (!cpf) return "—";
    if (cpf.length >= 11) return `***.***${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
    return "***";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pessoas ({pessoas.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Pessoa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Pessoa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Nome completo *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "").slice(0, 11) })} placeholder="Somente números" /></div>
                <div className="space-y-1">
                  <Label>Gênero</Label>
                  <Select value={form.genero} onValueChange={(v) => setForm({ ...form, genero: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Nível de Relacionamento</Label>
                <Select value={form.nivel_relacionamento} onValueChange={(v) => setForm({ ...form, nivel_relacionamento: v as NivelRelacionamento })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(nivelLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createPessoa.isPending}>
                {createPessoa.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={nivelFilter} onValueChange={setNivelFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Nível" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              {Object.entries(nivelLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : pessoas.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhuma pessoa encontrada.</p>
        ) : (
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Papéis</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pessoas.map((p: any) => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-accent/50" onClick={() => onSelect(p.id)}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell className="text-xs font-mono">{maskCpf(p.cpf)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={nivelColors[p.nivel_relacionamento] || ""}>{nivelLabels[p.nivel_relacionamento] || p.nivel_relacionamento}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(p.pessoas_papeis || []).filter((pp: any) => pp.ativo).slice(0, 2).map((pp: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">{pp.papel}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(p.pessoas_tags || []).slice(0, 3).map((pt: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px]" style={{ borderColor: pt.tags?.cor, color: pt.tags?.cor }}>{pt.tags?.nome}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {(p.pessoas_contatos || []).find((c: any) => c.principal)?.valor || (p.pessoas_contatos || [])[0]?.valor || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onSelect(p.id); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Excluir "${p.full_name}"?`)) return;
                          try { await deletePessoa.mutateAsync(p.id); toast({ title: "Pessoa excluída!" }); }
                          catch (err: any) { toast({ variant: "destructive", description: err.message }); }
                        }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
