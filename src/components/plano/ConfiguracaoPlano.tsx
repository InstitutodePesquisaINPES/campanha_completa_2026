import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings2, Sparkles } from "lucide-react";

export function ConfiguracaoPlano({ campanhaId }: { campanhaId: string }) {
  const qc = useQueryClient();
  const { data: params } = useQuery({
    queryKey: ["campanha-parametros", campanhaId],
    queryFn: async () => {
      const { data } = await supabase.from("campanha_parametros").select("*").eq("campanha_id", campanhaId).single();
      return data;
    },
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (params) setForm(params); }, [params]);

  const save = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("campanha_parametros").update(payload).eq("campanha_id", campanhaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Parâmetros salvos");
      qc.invalidateQueries({ queryKey: ["campanha-parametros", campanhaId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const gerar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("gerar_plano_90_dias" as any, { _campanha_id: campanhaId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano gerado");
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!form) return <p className="text-sm text-muted-foreground p-4">Carregando...</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings2 className="h-4 w-4" /> Estrutura do plano</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>Duração total (dias)</Label>
              <Input type="number" min={30} max={365} value={form.duracao_dias} onChange={(e) => setForm({ ...form, duracao_dias: Number(e.target.value) })} />
              <p className="text-[10px] text-muted-foreground mt-1">90, 120, 150, 180...</p>
            </div>
            <div>
              <Label>Nº de fases</Label>
              <Input type="number" min={3} max={8} value={form.num_fases} onChange={(e) => setForm({ ...form, num_fases: Number(e.target.value) })} />
            </div>
            <div className="flex items-center justify-between border rounded-lg px-3">
              <Label className="text-xs">Etapas sobrepostas</Label>
              <Switch checked={form.etapas_sobrepostas} onCheckedChange={(v) => setForm({ ...form, etapas_sobrepostas: v })} />
            </div>
            <div className="flex items-center justify-between border rounded-lg px-3">
              <Label className="text-xs">Preservar concluídas</Label>
              <Switch checked={form.preservar_concluidas} onCheckedChange={(v) => setForm({ ...form, preservar_concluidas: v })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Metas mínimas</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><Label>Cadastros mínimos</Label><Input type="number" value={form.min_cadastro} onChange={(e) => setForm({ ...form, min_cadastro: Number(e.target.value) })} /></div>
          <div><Label>Visitas mínimas</Label><Input type="number" value={form.min_visitas} onChange={(e) => setForm({ ...form, min_visitas: Number(e.target.value) })} /></div>
          <div><Label>Visitas/semana</Label><Input type="number" value={form.min_visitas_semana} onChange={(e) => setForm({ ...form, min_visitas_semana: Number(e.target.value) })} /></div>
          <div><Label>Fiscais mínimos</Label><Input type="number" value={form.min_fiscais} onChange={(e) => setForm({ ...form, min_fiscais: Number(e.target.value) })} /></div>
          <div><Label>% cadastro/votos</Label><Input type="number" step="0.01" value={form.pct_cadastro_sobre_votos} onChange={(e) => setForm({ ...form, pct_cadastro_sobre_votos: Number(e.target.value) })} /></div>
          <div><Label>% visitas/votos</Label><Input type="number" step="0.01" value={form.pct_visitas_sobre_votos} onChange={(e) => setForm({ ...form, pct_visitas_sobre_votos: Number(e.target.value) })} /></div>
          <div><Label>Votos por fiscal</Label><Input type="number" value={form.votos_por_fiscal} onChange={(e) => setForm({ ...form, votos_por_fiscal: Number(e.target.value) })} /></div>
          <div><Label>Custo por voto (R$)</Label><Input type="number" step="0.01" value={form.custo_por_voto_reais} onChange={(e) => setForm({ ...form, custo_por_voto_reais: Number(e.target.value) })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Marcos legais TSE (configuráveis)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ["Registro", "tse_registro"],
            ["Propaganda", "tse_propaganda"],
            ["HGPE", "tse_hgpe"],
            ["Prestação", "tse_prestacao"],
            ["Debates", "tse_debates"],
          ].map(([label, prefix]) => (
            <div key={prefix} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">{label}</Label>
                <Switch checked={form[`${prefix}_ativo`]} onCheckedChange={(v) => setForm({ ...form, [`${prefix}_ativo`]: v })} />
              </div>
              <div>
                <Label className="text-[10px]">Dias antes da eleição</Label>
                <Input type="number" value={form[`${prefix}_dias`]} onChange={(e) => setForm({ ...form, [`${prefix}_dias`]: Number(e.target.value) })} disabled={!form[`${prefix}_ativo`]} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={() => gerar.mutate()} disabled={gerar.isPending}>
          <Sparkles className="h-4 w-4 mr-2" /> {gerar.isPending ? "Gerando..." : "Gerar/Regenerar plano agora"}
        </Button>
        <Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar parâmetros"}</Button>
      </div>
    </div>
  );
}
