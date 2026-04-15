import { useState } from "react";
import { useDemanda, useUpdateDemanda, useEncaminhamentos, useCreateEncaminhamento, statusLabels, statusColors, prioridadeLabels, prioridadeColors, categoriaLabels, origemLabels } from "@/hooks/useDemandas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Send, FileText, Clock, AlertTriangle } from "lucide-react";

export function DemandaDetail({ demandaId, onBack }: { demandaId: string; onBack: () => void }) {
  const { toast } = useToast();
  const { data: demanda, isLoading } = useDemanda(demandaId);
  const updateDemanda = useUpdateDemanda();
  const { data: encaminhamentos = [] } = useEncaminhamentos(demandaId);
  const createEncaminhamento = useCreateEncaminhamento();

  const [encObs, setEncObs] = useState("");
  const [resDescricao, setResDescricao] = useState("");

  if (isLoading || !demanda) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isOverdue = demanda.status !== "resolvida" && demanda.status !== "arquivada" && demanda.data_prazo && new Date(demanda.data_prazo) < new Date();

  const handleStatusChange = async (status: string) => {
    try {
      const updates: any = { id: demandaId, status };
      if (status === "resolvida") updates.data_resolucao = new Date().toISOString();
      await updateDemanda.mutateAsync(updates);
      toast({ title: `Status atualizado para ${statusLabels[status]}` });
    } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
  };

  const handleEncaminhamento = async () => {
    if (!encObs.trim()) return;
    try {
      await createEncaminhamento.mutateAsync({ demanda_id: demandaId, observacao: encObs.trim() });
      setEncObs("");
      toast({ title: "Encaminhamento registrado!" });
    } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
  };

  const handleResolve = async () => {
    try {
      await updateDemanda.mutateAsync({
        id: demandaId, status: "resolvida" as any,
        resolucao_descricao: resDescricao || undefined,
        data_resolucao: new Date().toISOString(),
      });
      toast({ title: "Demanda resolvida!" });
    } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{demanda.titulo}</h2>
            {isOverdue && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />SLA Vencido</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="font-mono text-[10px]">{demanda.protocolo}</Badge>
            <Badge variant="outline" className={`text-[10px] ${prioridadeColors[demanda.prioridade]}`}>{prioridadeLabels[demanda.prioridade]}</Badge>
            <Badge variant="outline" className={`text-[10px] ${statusColors[demanda.status]}`}>{statusLabels[demanda.status]}</Badge>
            {demanda.categoria && <Badge variant="secondary" className="text-[10px]">{categoriaLabels[demanda.categoria]}</Badge>}
          </div>
        </div>
        <Select value={demanda.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(statusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4">
          <p className="text-[10px] text-muted-foreground">Pessoa</p>
          <p className="text-sm font-medium">{(demanda as any).pessoas?.full_name || "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[10px] text-muted-foreground">Origem</p>
          <p className="text-sm font-medium">{demanda.origem ? origemLabels[demanda.origem] : "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[10px] text-muted-foreground">Abertura</p>
          <p className="text-sm font-medium">{new Date(demanda.data_abertura).toLocaleDateString("pt-BR")}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[10px] text-muted-foreground">Prazo SLA</p>
          <p className={`text-sm font-medium ${isOverdue ? "text-destructive" : ""}`}>
            {demanda.data_prazo ? new Date(demanda.data_prazo).toLocaleDateString("pt-BR") : "—"}
          </p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="detalhes">
        <TabsList>
          <TabsTrigger value="detalhes"><FileText className="h-3 w-3 mr-1" />Detalhes</TabsTrigger>
          <TabsTrigger value="encaminhamentos"><Send className="h-3 w-3 mr-1" />Encaminhamentos ({encaminhamentos.length})</TabsTrigger>
          <TabsTrigger value="resolucao"><Clock className="h-3 w-3 mr-1" />Resolução</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes">
          <Card>
            <CardContent className="pt-4 space-y-3">
              {demanda.descricao && (
                <div><Label className="text-xs text-muted-foreground">Descrição</Label><p className="text-sm mt-1 whitespace-pre-wrap">{demanda.descricao}</p></div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Município:</span> {(demanda as any).municipios?.nome || "—"}</div>
                <div><span className="text-muted-foreground text-xs">Bairro:</span> {(demanda as any).bairros?.nome || "—"}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encaminhamentos">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Encaminhamentos</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input className="flex-1" placeholder="Observação do encaminhamento..." value={encObs} onChange={(e) => setEncObs(e.target.value)} />
                <Button size="sm" onClick={handleEncaminhamento} disabled={createEncaminhamento.isPending}>
                  <Send className="h-4 w-4 mr-1" />Encaminhar
                </Button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-auto">
                {encaminhamentos.map((enc: any) => (
                  <div key={enc.id} className="p-3 rounded bg-accent/30 border-l-2 border-primary">
                    <span className="text-[10px] text-muted-foreground">{new Date(enc.created_at).toLocaleString("pt-BR")}</span>
                    <p className="text-sm mt-1">{enc.observacao}</p>
                  </div>
                ))}
                {encaminhamentos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum encaminhamento.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolucao">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Resolução</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {demanda.status === "resolvida" ? (
                <div>
                  <Badge variant="default" className="mb-2">Resolvida em {demanda.data_resolucao ? new Date(demanda.data_resolucao).toLocaleDateString("pt-BR") : "—"}</Badge>
                  {demanda.resolucao_descricao && <p className="text-sm whitespace-pre-wrap">{demanda.resolucao_descricao}</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Descrição da resolução</Label>
                    <Textarea value={resDescricao} onChange={(e) => setResDescricao(e.target.value)} rows={4} placeholder="Descreva como a demanda foi resolvida..." />
                  </div>
                  <Button onClick={handleResolve} disabled={updateDemanda.isPending}>
                    {updateDemanda.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Marcar como Resolvida
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
