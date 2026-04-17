import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

export function TagsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [cor, setCor] = useState("#3B82F6");

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["admin-tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tags").insert({ nome, categoria: categoria || null, cor });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tags"] });
      setNome(""); setCategoria(""); setCor("#3B82F6");
      toast({ title: "Tag criada!" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tags"] });
      toast({ title: "Tag removida" });
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags & Categorias ({tags.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-end p-3 border rounded-lg">
          <div className="flex-1 min-w-40">
            <label className="text-xs text-muted-foreground">Nome</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex: Apoiador Forte" />
          </div>
          <div className="flex-1 min-w-32">
            <label className="text-xs text-muted-foreground">Categoria</label>
            <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="opcional" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Cor</label>
            <Input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="w-20 h-10 p-1" />
          </div>
          <Button onClick={() => create.mutate()} disabled={!nome || create.isPending}>
            <Plus className="h-4 w-4 mr-1" />Criar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((t: any) => (
            <Badge key={t.id} className="gap-2 py-1.5 px-3" style={{ backgroundColor: t.cor + "33", color: t.cor, borderColor: t.cor }} variant="outline">
              {t.nome}
              {t.categoria && <span className="opacity-60">· {t.categoria}</span>}
              <button onClick={() => remove.mutate(t.id)} className="hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {tags.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tag cadastrada.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
