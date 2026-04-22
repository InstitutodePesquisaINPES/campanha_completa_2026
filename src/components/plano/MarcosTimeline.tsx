import { useMemo, useState } from "react";
import { useTarefas, type Tarefa } from "@/hooks/useCampanhas";
import { useCanManage } from "@/hooks/useUserRoles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag, ShieldAlert, ShieldCheck, CalendarDays } from "lucide-react";
import { TarefaDetailDrawer } from "./TarefaDetailDrawer";

type TarefaExt = Tarefa & {
  is_marco?: boolean | null;
  fase_legal?: string | null;
  permitido_antes_registro?: boolean | null;
};

const statusTone: Record<string, string> = {
  concluida: "bg-success text-success-foreground",
  em_andamento: "bg-info text-info-foreground",
  pendente: "bg-muted text-muted-foreground",
  atrasada: "bg-destructive text-destructive-foreground",
};

export function MarcosTimeline({ campanhaId }: { campanhaId: string }) {
  const { data: tarefas = [], isLoading } = useTarefas(campanhaId);
  const canManage = useCanManage();
  const [selected, setSelected] = useState<Tarefa | null>(null);

  const marcos = useMemo(
    () => (tarefas as TarefaExt[]).filter((t) => t.is_marco).sort((a, b) => a.dia - b.dia),
    [tarefas],
  );

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando marcos...</div>;

  if (marcos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Flag className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhum marco definido. Marque tarefas críticas como "marco" no detalhe da tarefa.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{marcos.length} marcos críticos no plano</p>
      </div>
      <div className="relative pl-6 border-l-2 border-border space-y-3">
        {marcos.map((t) => (
          <Card
            key={t.id}
            className="cursor-pointer hover:shadow-md transition relative"
            onClick={() => setSelected(t)}
          >
            <div className="absolute -left-[1.85rem] top-4 h-4 w-4 rounded-full bg-warning border-2 border-background" />
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Flag className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{t.titulo}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <CalendarDays className="h-3 w-3" />
                      D{t.dia} · {new Date(t.data_prevista).toLocaleDateString("pt-BR")}
                      {(t as TarefaExt & { responsavel_papel?: string | null }).responsavel_papel && (
                        <> · 👤 {(t as TarefaExt & { responsavel_papel?: string | null }).responsavel_papel}</>
                      )}
                    </p>
                  </div>
                </div>
                <Badge className={`text-[10px] capitalize ${statusTone[t.status] ?? ""}`}>
                  {t.status === "pendente" ? "a fazer" : t.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {t.fase_legal === "campanha_oficial" ? (
                  <Badge variant="outline" className="text-[10px] gap-1 bg-warning/10 text-warning border-warning/30">
                    <ShieldAlert className="h-2.5 w-2.5" />Campanha oficial
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-1 bg-info/10 text-info border-info/30">
                    <ShieldCheck className="h-2.5 w-2.5" />Pré-campanha (legal)
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] capitalize">{t.area}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TarefaDetailDrawer
        tarefa={selected}
        open={!!selected}
        onOpenChange={(v) => { if (!v) setSelected(null); }}
        canManage={canManage}
      />
    </div>
  );
}
