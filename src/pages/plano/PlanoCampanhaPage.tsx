import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CampanhaSelector } from "@/components/plano/CampanhaSelector";
import { CronogramaTarefas } from "@/components/plano/CronogramaTarefas";
import { MetasFases, PlanejamentoSemanal } from "@/components/plano/MetasESemanas";
import { ParametrosGerador } from "@/components/plano/ParametrosGerador";
import { MarcosTimeline } from "@/components/plano/MarcosTimeline";
import { PlanoResumoExecutivo } from "@/components/plano/PlanoResumoExecutivo";
import { PlanoIntegracoesBar } from "@/components/plano/PlanoIntegracoesBar";
import { useCampanha, useCampanhaAtiva, useUpdateCampanha } from "@/hooks/useCampanhas";
import { useCanManage } from "@/hooks/useUserRoles";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Vote, Calendar, Target, Trophy, Flame, Settings2, Flag, Pencil, Save, Activity, Plus } from "lucide-react";
import { EditarCampanhaDialog } from "@/components/plano/EditarCampanhaDialog";

export default function PlanoCampanhaPage() {
  const { data: ativa } = useCampanhaAtiva();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const currentId = selectedId ?? ativa?.id;
  const { data: campanha } = useCampanha(currentId);
  const canManage = useCanManage();
  const updateCampanha = useUpdateCampanha();
  const [metaOpen, setMetaOpen] = useState(false);
  const [metaInput, setMetaInput] = useState<string>("");

  const duracaoTotal = campanha
    ? Math.max(1, Math.ceil((new Date(campanha.data_eleicao).getTime() - new Date(campanha.data_inicio_plano).getTime()) / 86400000))
    : null;
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
              Plano de Campanha {duracaoTotal ? `· ${duracaoTotal} dias` : ""}
            </h1>
            <p className="text-muted-foreground mt-1">
              {campanha
                ? `Início ${new Date(campanha.data_inicio_plano).toLocaleDateString("pt-BR")} · Eleição ${new Date(campanha.data_eleicao).toLocaleDateString("pt-BR")} · Cronograma · Marcos · Fases · Metas`
                : "Cronograma · Marcos · Fases · Metas · Acompanhamento semanal"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CampanhaSelector value={currentId} onChange={setSelectedId} />
            {campanha && canManage && <EditarCampanhaDialog campanha={campanha as never} />}
          </div>
        </div>

        {!campanha ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Vote className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h2 className="text-lg font-semibold mb-1">Nenhuma campanha selecionada</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Crie uma nova campanha para gerar automaticamente o plano completo (cronograma, fases, semanas, metas e marcos legais TSE).
              </p>
              <div className="flex items-center justify-center gap-2">
                <CampanhaSelector value={currentId} onChange={setSelectedId} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Use o botão <strong>“Nova”</strong> ao lado do seletor para criar a primeira campanha.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="group relative">
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
                  {canManage && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                      <EditarCampanhaDialog
                        campanha={campanha as never}
                        trigger={<Button size="icon" variant="ghost" className="h-6 w-6"><Pencil className="h-3 w-3" /></Button>}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              <Popover open={metaOpen} onOpenChange={(o) => { setMetaOpen(o); if (o) setMetaInput(String(campanha.meta_votos ?? "")); }}>
                <PopoverTrigger asChild>
                  <Card className={`group ${canManage ? "cursor-pointer hover:border-primary/60 hover:shadow-md transition" : ""}`}>
                    <CardContent className="p-4 relative">
                      <Target className="h-4 w-4 text-success mb-1" />
                      <div className="text-2xl font-bold">{campanha.meta_votos?.toLocaleString("pt-BR") ?? "—"}</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Meta de votos
                        {canManage && <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-70 transition" />}
                      </p>
                    </CardContent>
                  </Card>
                </PopoverTrigger>
                {canManage && (
                  <PopoverContent className="w-72" align="start">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Meta de votos</Label>
                        <Input
                          autoFocus
                          type="number"
                          min={0}
                          value={metaInput}
                          onChange={(e) => setMetaInput(e.target.value)}
                          placeholder="Ex: 5000"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Usada nos KPIs do Comando, geração do plano e cálculo de cadastros/visitas.
                        </p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setMetaOpen(false)}>Cancelar</Button>
                        <Button
                          size="sm"
                          className="gap-1"
                          disabled={updateCampanha.isPending || !metaInput || Number(metaInput) < 0}
                          onClick={() =>
                            updateCampanha.mutate(
                              { id: campanha.id, meta_votos: Number(metaInput) },
                              { onSuccess: () => setMetaOpen(false) },
                            )
                          }
                        >
                          <Save className="h-3.5 w-3.5" />
                          {updateCampanha.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                )}
              </Popover>
              <Card>
                <CardContent className="p-4">
                  <Calendar className="h-4 w-4 text-info mb-1" />
                  <div className="text-2xl font-bold">{diasDecorridos}<span className="text-sm text-muted-foreground">/{duracaoTotal ?? "—"}</span></div>
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

            <PlanoIntegracoesBar campanhaId={campanha.id} />

            <Tabs defaultValue="resumo">
              <TabsList>
                <TabsTrigger value="resumo" className="gap-1"><Activity className="h-3.5 w-3.5" />Resumo</TabsTrigger>
                <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
                <TabsTrigger value="marcos" className="gap-1"><Flag className="h-3.5 w-3.5" />Marcos</TabsTrigger>
                <TabsTrigger value="metas">Fases & Metas</TabsTrigger>
                <TabsTrigger value="semanas">Semana a semana</TabsTrigger>
                <TabsTrigger value="parametros" className="gap-1"><Settings2 className="h-3.5 w-3.5" /> Parâmetros</TabsTrigger>
              </TabsList>
              <TabsContent value="resumo" className="mt-4">
                <PlanoResumoExecutivo campanhaId={campanha.id} />
              </TabsContent>
              <TabsContent value="cronograma" className="mt-4">
                <CronogramaTarefas campanhaId={campanha.id} />
              </TabsContent>
              <TabsContent value="marcos" className="mt-4">
                <MarcosTimeline campanhaId={campanha.id} />
              </TabsContent>
              <TabsContent value="metas" className="mt-4">
                <MetasFases campanhaId={campanha.id} />
              </TabsContent>
              <TabsContent value="semanas" className="mt-4">
                <PlanejamentoSemanal campanhaId={campanha.id} />
              </TabsContent>
              <TabsContent value="parametros" className="mt-4">
                <ParametrosGerador campanhaId={campanha.id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}
