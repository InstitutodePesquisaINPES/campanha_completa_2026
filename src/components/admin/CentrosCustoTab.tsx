import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

export function CentrosCustoTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [orcamento, setOrcamento] = useState("0");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-centros-custo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("centros_custo").select("*").order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("centros_custo").insert({
        nome, descricao: descricao || null, orcamento_previsto: Number(orcamento) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-centros-custo"] });
      setNome(""); setDescricao(""); setOrcamento("0");
      toast({ title: "Centro de custo criado!" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("centros_custo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-centros-custo"] });
      toast({ title: "Removido" });
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Centros de Custo ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-end p-3 border rounded-lg">
          <div className="flex-1 min-w-40">
            <label className="text-xs text-muted-foreground">Nome</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="flex-1 min-w-40">
            <label className="text-xs text-muted-foreground">Descrição</label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Orçamento (R$)</label>
            <Input type="number" value={orcamento} onChange={(e) => setOrcamento(e.target.value)} className="w-32" />
          </div>
          <Button onClick={() => create.mutate()} disabled={!nome || create.isPending}>
            <Plus className="h-4 w-4 mr-1" />Criar
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Orçamento</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.descricao || "—"}</TableCell>
                <TableCell className="text-right font-mono">
                  {Number(c.orcamento_previsto).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Nenhum centro de custo</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
