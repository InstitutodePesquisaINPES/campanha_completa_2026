import { useFases, useMetas, useSemanas, useUpdateMeta } from "@/hooks/useCampanhas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Target, Flag } from "lucide-react";

const faseLabels: Record<string, string> = {
  pre_campanha: "Pré-campanha",
  lancamento: "Lançamento",
  consolidacao: "Consolidação",
  reta_final: "Reta Final",
};

const faseColors: Record<string, string> = {
  pre_campanha: "bg-info/10 text-info border-info/30",
  lancamento: "bg-primary/10 text-primary border-primary/30",
  consolidacao: "bg-success/10 text-success border-success/30",
  reta_final: "bg-destructive/10 text-destructive border-destructive/30",
};

export function MetasFases({ campanhaId }: { campanhaId: string }) {
  const { data: fases = [] } = useFases(campanhaId);
  const { data: metas = [] } = useMetas(campanhaId);
  const update = useUpdateMeta();

  const metasPorFase = (faseKey: string) => metas.filter((m) => m.fase === faseKey);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {fases.map((f) => {
        const ms = metasPorFase(f.fase);
        const total = ms.reduce((acc, m) => acc + (Number(m.valor_meta) || 0), 0);
        const realizado = ms.reduce((acc, m) => acc + (Number(m.valor_realizado) || 0), 0);
        const pct = total > 0 ? Math.min(100, Math.round((realizado / total) * 100)) : 0;
        return (
          <Card key={f.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flag className="h-4 w-4 text-primary" />
                  {f.nome}
                </CardTitle>
                <Badge variant="outline" className={faseColors[f.fase]}>{faseLabels[f.fase]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(f.data_inicio).toLocaleDateString("pt-BR")} → {new Date(f.data_fim).toLocaleDateString("pt-BR")}
              </p>
              {f.foco && <p className="text-xs text-muted-foreground italic">{f.foco}</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progresso geral da fase</span>
                  <span className="font-medium">{pct}%</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
              <div className="space-y-2">
                {ms.map((m) => {
                  const p = Number(m.valor_meta) > 0 ? Math.min(100, Math.round((Number(m.valor_realizado) / Number(m.valor_meta)) * 100)) : 0;
                  return (
                    <div key={m.id} className="border border-border rounded-md p-2.5">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.meta}</p>
                          <p className="text-[10px] text-muted-foreground">{m.indicador} · área {m.area}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{p}%</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="h-7 text-xs w-24"
                          defaultValue={Number(m.valor_realizado)}
                          onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (v !== Number(m.valor_realizado)) update.mutate({ id: m.id, valor_realizado: v });
                          }}
                        />
                        <span className="text-xs text-muted-foreground">/ meta {Number(m.valor_meta).toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                  );
                })}
                {ms.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Sem metas nesta fase</p>}
              </div>
            </CardContent>
          </Card>
        );
      })}
      {fases.length === 0 && (
        <Card className="lg:col-span-2">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhuma fase configurada. Crie uma campanha para gerar o plano automaticamente.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function PlanejamentoSemanal({ campanhaId }: { campanhaId: string }) {
  const { data: semanas = [] } = useSemanas(campanhaId);

  return (
    <div className="space-y-2">
      {semanas.map((s) => (
        <Card key={s.id}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">Semana {s.numero_semana}</span>
                  <Badge variant="outline" className={faseColors[s.fase]}>{faseLabels[s.fase]}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(s.data_inicio).toLocaleDateString("pt-BR")} → {new Date(s.data_fim).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground/90">{s.foco_principal}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-[11px]">
                  {s.meta_campo && <div className="bg-success/5 text-foreground p-1.5 rounded border border-success/20"><span className="font-medium text-success">Campo: </span>{s.meta_campo}</div>}
                  {s.meta_digital && <div className="bg-info/5 text-foreground p-1.5 rounded border border-info/20"><span className="font-medium text-info">Digital: </span>{s.meta_digital}</div>}
                  {s.meta_financeiro && <div className="bg-warning/5 text-foreground p-1.5 rounded border border-warning/20"><span className="font-medium text-warning">Financeiro: </span>{s.meta_financeiro}</div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {semanas.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sem semanas configuradas.</p>}
    </div>
  );
}
