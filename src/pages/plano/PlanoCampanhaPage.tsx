import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CampanhaSelector } from "@/components/plano/CampanhaSelector";
import { CronogramaTarefas } from "@/components/plano/CronogramaTarefas";
import { MetasFases, PlanejamentoSemanal } from "@/components/plano/MetasESemanas";
import { useCampanha, useCampanhaAtiva } from "@/hooks/useCampanhas";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Vote, Calendar, Target, Trophy, Flame } from "lucide-react";

export default function PlanoCampanhaPage() {
  const { data: ativa } = useCampanhaAtiva();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const currentId = selectedId ?? ativa?.id;
  const { data: campanha } = useCampanha(currentId);

  const diasParaEleicao = campanha
    ? Math.ceil((new Date(campanha.data_eleicao).getTime() - Date.now()) / 86400000)
    : null;
  const diasDecorridos = campanha
    ? Math.max(0, Math.ceil((Date.now() - new Date(campanha.data_inicio_plano).getTime()) / 86400000))
    : null;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Vote className="h-7 w-7 text-primary" />
              Plano de Campanha 90 dias
            </h1>
            <p className="text-muted-foreground mt-1">
              Cronograma · Fases · Metas · Acompanhamento semanal
            </p>
          </div>
          <CampanhaSelector value={currentId} onChange={setSelectedId} />
        </div>

        {!campanha ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Vote className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h2 className="text-lg font-semibold mb-1">Nenhuma campanha selecionada</h2>
              <p className="text-sm text-muted-foreground">Crie uma nova campanha para gerar automaticamente o plano de 90 dias com 56 tarefas, 4 fases, 13 semanas e 11 metas.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <Trophy className="h-4 w-4 text-warning" />
                    <Badge variant="outline" className="text-[10px] capitalize">{campanha.cargo.replace("_", " ")}</Badge>
                  </div>
                  <div className="text-lg font-bold truncate">{campanha.nome}</div>
                  <p className="text-xs text-muted-foreground truncate">
                    {(campanha as any).municipios?.nome ?? (campanha as any).estados?.nome ?? "Sem escopo"}
                    {(campanha as any).municipios_foco_ids?.length > 0 && ` · +${(campanha as any).municipios_foco_ids.length} foco`}
                  </p>
                  <p className="text-xs text-muted-foreground">{campanha.numero_urna ? `Nº ${campanha.numero_urna}` : "Sem nº urna"}{campanha.partido_sigla ? ` · ${campanha.partido_sigla}` : ""}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Target className="h-4 w-4 text-success mb-1" />
                  <div className="text-2xl font-bold">{campanha.meta_votos?.toLocaleString("pt-BR") ?? "—"}</div>
                  <p className="text-xs text-muted-foreground">Meta de votos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Calendar className="h-4 w-4 text-info mb-1" />
                  <div className="text-2xl font-bold">{diasDecorridos}<span className="text-sm text-muted-foreground">/90</span></div>
                  <p className="text-xs text-muted-foreground">Dias do plano decorridos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Flame className={`h-4 w-4 mb-1 ${diasParaEleicao && diasParaEleicao < 30 ? "text-destructive" : "text-warning"}`} />
                  <div className={`text-2xl font-bold ${diasParaEleicao && diasParaEleicao < 30 ? "text-destructive" : ""}`}>
                    {diasParaEleicao ?? "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">Dias até a eleição</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="cronograma">
              <TabsList>
                <TabsTrigger value="cronograma">Cronograma 90d</TabsTrigger>
                <TabsTrigger value="metas">Fases & Metas</TabsTrigger>
                <TabsTrigger value="semanas">Semana a semana</TabsTrigger>
              </TabsList>
              <TabsContent value="cronograma" className="mt-4">
                <CronogramaTarefas campanhaId={campanha.id} />
              </TabsContent>
              <TabsContent value="metas" className="mt-4">
                <MetasFases campanhaId={campanha.id} />
              </TabsContent>
              <TabsContent value="semanas" className="mt-4">
                <PlanejamentoSemanal campanhaId={campanha.id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}
