import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Flag, ShieldCheck, ShieldAlert, Paperclip, ListChecks, User as UserIcon } from "lucide-react";

const areaColors: Record<string, string> = {
  organizacao: "bg-primary/10 text-primary border-primary/30",
  campo: "bg-success/10 text-success border-success/30",
  digital: "bg-info/10 text-info border-info/30",
  financeiro: "bg-warning/10 text-warning border-warning/30",
  juridico: "bg-destructive/10 text-destructive border-destructive/30",
  comunicacao: "bg-accent text-accent-foreground border-border",
  logistica: "bg-muted text-muted-foreground border-border",
  dados: "bg-secondary text-secondary-foreground border-border",
};
const prioColors: Record<string, string> = {
  urgente: "bg-destructive/10 text-destructive border-destructive/30",
  alta: "bg-warning/10 text-warning border-warning/30",
  media: "bg-info/10 text-info border-info/30",
  baixa: "bg-muted text-muted-foreground",
};

export type TarefaPreview = {
  titulo: string;
  area: string;
  prioridade: string;
  data_prevista: string;
  dia: number;
  semana: number;
  is_marco?: boolean;
  fase_legal?: "pre_campanha_legal" | "campanha_oficial" | "pos_eleicao";
  permitido_antes_registro?: boolean;
  responsavel_papel?: string;
  subtarefas_count?: number;
};

export function TarefaPreviewCard({ t }: { t: TarefaPreview }) {
  const isMarco = !!t.is_marco;
  const dataFmt = t.data_prevista
    ? new Date(t.data_prevista).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })
    : "—";
  return (
    <div className="space-y-3">
      {/* Como aparece no Kanban / Lista */}
      <div>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
          Como aparecerá no Kanban / Lista
        </p>
        <Card className={`group ${isMarco ? "border-l-4 border-l-warning" : ""}`}>
          <CardContent className="p-2.5 flex items-start gap-2">
            <Checkbox checked={false} disabled className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug flex items-center gap-1.5">
                  {isMarco && <Flag className="h-3.5 w-3.5 text-warning shrink-0" />}
                  <span className="line-clamp-2">{t.titulo || "(sem título)"}</span>
                </p>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                  D{t.dia} · S{t.semana}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{dataFmt}</div>
              <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                <Badge variant="outline" className={`text-[10px] capitalize ${areaColors[t.area] ?? ""}`}>{t.area}</Badge>
                <Badge variant="outline" className={`text-[10px] capitalize ${prioColors[t.prioridade] ?? ""}`}>{t.prioridade}</Badge>
                {t.fase_legal === "campanha_oficial" ? (
                  <Badge variant="outline" className="text-[10px] gap-0.5 bg-warning/10 text-warning border-warning/30">
                    <ShieldAlert className="h-2.5 w-2.5" />pós-registro
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-0.5 bg-info/10 text-info border-info/30">
                    <ShieldCheck className="h-2.5 w-2.5" />pré
                  </Badge>
                )}
                {(t.subtarefas_count ?? 0) > 0 && (
                  <Badge variant="outline" className="text-[10px] gap-0.5">
                    <ListChecks className="h-2.5 w-2.5" />{t.subtarefas_count}
                  </Badge>
                )}
                {t.responsavel_papel && (
                  <Badge variant="outline" className="text-[10px] truncate max-w-[140px]">
                    <UserIcon className="h-2.5 w-2.5 mr-0.5" />{t.responsavel_papel}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Como aparece na Timeline de Marcos */}
      {isMarco && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Como aparecerá em Marcos</p>
          <div className="relative pl-6 border-l-2 border-warning/40">
            <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-warning ring-2 ring-background" />
            <div className="rounded-md border bg-warning/5 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5 text-warning" />
                  {t.titulo || "(sem título)"}
                </p>
                <Badge className="bg-warning text-warning-foreground text-[10px]">MARCO</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {dataFmt} · D{t.dia} · S{t.semana}
                {t.responsavel_papel ? ` · ${t.responsavel_papel}` : ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
