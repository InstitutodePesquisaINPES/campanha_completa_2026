import { useState } from "react";
import { useContratoAprovacoes, useDecidirAprovacao, useRecriarAprovacoes, PAPEL_LABEL, STATUS_LABEL, type AprovacaoStatus } from "@/hooks/useContratoAprovacoes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, RotateCw, AlertCircle, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusVariant: Record<AprovacaoStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pendente: "outline",
  aprovado: "default",
  rejeitado: "destructive",
  revisao: "secondary",
};

const statusIcon: Record<AprovacaoStatus, React.ElementType> = {
  pendente: Clock,
  aprovado: CheckCircle2,
  rejeitado: XCircle,
  revisao: RotateCw,
};

export function ContratoAprovacaoPanel({ contratoId }: { contratoId: string }) {
  const { data: etapas = [], isLoading } = useContratoAprovacoes(contratoId);
  const decidir = useDecidirAprovacao();
  const recriar = useRecriarAprovacoes();
  const [obs, setObs] = useState<Record<string, string>>({});

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando workflow…</div>;

  if (etapas.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma etapa de aprovação cadastrada.</p>
          <Button size="sm" variant="outline" onClick={() => recriar.mutate(contratoId)}>
            <RotateCw className="h-3.5 w-3.5 mr-1" /> Gerar workflow
          </Button>
        </CardContent>
      </Card>
    );
  }

  // próxima etapa pendente determina quem pode aprovar (sequencial)
  const proximaPendente = etapas.find((e) => e.status === "pendente");

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Workflow de Aprovação
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={() => recriar.mutate(contratoId)} title="Recriar etapas pendentes">
          <RotateCw className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stepper visual */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {etapas.map((e, idx) => {
            const Icon = statusIcon[e.status];
            const color =
              e.status === "aprovado" ? "bg-success text-success-foreground" :
              e.status === "rejeitado" ? "bg-destructive text-destructive-foreground" :
              e.status === "revisao" ? "bg-warning text-warning-foreground" :
              "bg-muted text-muted-foreground";
            return (
              <div key={e.id} className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <div className="font-medium">{PAPEL_LABEL[e.papel]}</div>
                  <div className="text-muted-foreground">Etapa {e.ordem}</div>
                </div>
                {idx < etapas.length - 1 && <div className="h-px w-8 bg-border" />}
              </div>
            );
          })}
        </div>

        {/* Cards de cada etapa */}
        <div className="space-y-2">
          {etapas.map((e) => {
            const isProxima = proximaPendente?.id === e.id;
            const podeDecidir = e.status === "pendente" && isProxima;
            return (
              <div
                key={e.id}
                className={`rounded-lg border p-3 space-y-2 ${isProxima ? "border-primary/40 bg-primary/5" : "border-border"}`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                    <span className="text-sm font-medium">{PAPEL_LABEL[e.papel]} · Etapa {e.ordem}</span>
                    {e.exige_observacao && <Badge variant="outline" className="text-[10px]">Observação obrigatória</Badge>}
                  </div>
                  {e.decidido_em && (
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(e.decidido_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>

                {e.observacao && (
                  <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-2">
                    "{e.observacao}"
                  </p>
                )}

                {podeDecidir && (
                  <div className="space-y-2 pt-1">
                    <Textarea
                      rows={2}
                      placeholder={e.exige_observacao ? "Observação obrigatória…" : "Observação (opcional)"}
                      value={obs[e.id] || ""}
                      onChange={(ev) => setObs({ ...obs, [e.id]: ev.target.value })}
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (e.exige_observacao && !(obs[e.id] || "").trim()) {
                            return alert("Observação obrigatória.");
                          }
                          decidir.mutate({ id: e.id, status: "aprovado", observacao: obs[e.id] });
                        }}
                        disabled={decidir.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (!(obs[e.id] || "").trim()) return alert("Justifique a rejeição.");
                          decidir.mutate({ id: e.id, status: "rejeitado", observacao: obs[e.id] });
                        }}
                        disabled={decidir.isPending}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decidir.mutate({ id: e.id, status: "revisao", observacao: obs[e.id] })}
                        disabled={decidir.isPending}
                      >
                        <RotateCw className="h-3.5 w-3.5 mr-1" /> Pedir revisão
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
