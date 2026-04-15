import { useState } from "react";
import { useAgendaItem, useUpdateAgenda, useParticipantes, useCreateParticipante, useUpdateParticipante, useDeleteParticipante, useCheckins, useCreateCheckin, useFollowups, useCreateFollowup, useUpdateFollowup, tipoAgendaLabels, statusAgendaLabels, statusAgendaColors, papelParticipanteLabels } from "@/hooks/useAgenda";
import { usePessoas } from "@/hooks/usePessoas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Trash2, Users, MapPinCheck, ListChecks, Info } from "lucide-react";

export function AgendaDetail({ agendaId, onBack }: { agendaId: string; onBack: () => void }) {
  const { toast } = useToast();
  const { data: item, isLoading } = useAgendaItem(agendaId);
  const updateAgenda = useUpdateAgenda();
  const { data: participantes = [] } = useParticipantes(agendaId);
  const createParticipante = useCreateParticipante();
  const updateParticipante = useUpdateParticipante();
  const deleteParticipante = useDeleteParticipante();
  const { data: checkins = [] } = useCheckins(agendaId);
  const createCheckin = useCreateCheckin();
  const { data: followups = [] } = useFollowups(agendaId);
  const createFollowup = useCreateFollowup();
  const updateFollowup = useUpdateFollowup();

  const [pessoaSearch, setPessoaSearch] = useState("");
  const { data: pessoaResults = [] } = usePessoas(pessoaSearch || undefined);
  const [fwDesc, setFwDesc] = useState("");
  const [fwPrazo, setFwPrazo] = useState("");

  if (isLoading || !item) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const handleStatusChange = async (status: string) => {
    try {
      await updateAgenda.mutateAsync({ id: agendaId, status: status as any });
      toast({ title: `Status atualizado para ${statusAgendaLabels[status]}` });
    } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
  };

  const handleCheckin = async (tipo: "checkin" | "checkout") => {
    try {
      let lat: number | undefined, lng: number | undefined;
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })).catch(() => null);
        if (pos) { lat = pos.coords.latitude; lng = pos.coords.longitude; }
      }
      await createCheckin.mutateAsync({ agenda_id: agendaId, tipo, latitude: lat, longitude: lng });
      toast({ title: tipo === "checkin" ? "Check-in registrado!" : "Check-out registrado!" });
    } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
  };

  const handleAddParticipante = async (pessoaId: string, nome: string) => {
    try {
      await createParticipante.mutateAsync({ agenda_id: agendaId, pessoa_id: pessoaId });
      setPessoaSearch("");
      toast({ title: `${nome} adicionado!` });
    } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
  };

  const handleAddFollowup = async () => {
    if (!fwDesc.trim()) return;
    try {
      await createFollowup.mutateAsync({ agenda_id: agendaId, descricao: fwDesc.trim(), prazo: fwPrazo || undefined });
      setFwDesc(""); setFwPrazo("");
      toast({ title: "Follow-up adicionado!" });
    } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
  };

  const confirmados = participantes.filter((p: any) => p.confirmado).length;
  const presentes = participantes.filter((p: any) => p.presente).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{item.titulo}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px]">{tipoAgendaLabels[item.tipo]}</Badge>
            <Badge variant="outline" className={`text-[10px] ${statusAgendaColors[item.status]}`}>{statusAgendaLabels[item.status]}</Badge>
            <span className="text-xs text-muted-foreground">{new Date(item.data_inicio).toLocaleString("pt-BR")}</span>
            {item.local && <span className="text-xs text-muted-foreground">— {item.local}</span>}
          </div>
        </div>
        <Select value={item.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(statusAgendaLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4"><p className="text-[10px] text-muted-foreground">Participantes</p><p className="text-lg font-bold">{participantes.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-[10px] text-muted-foreground">Confirmados</p><p className="text-lg font-bold text-green-400">{confirmados}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-[10px] text-muted-foreground">Presentes</p><p className="text-lg font-bold text-primary">{presentes}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-[10px] text-muted-foreground">Check-ins</p><p className="text-lg font-bold">{checkins.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="participantes">
        <TabsList className="flex-wrap">
          <TabsTrigger value="participantes"><Users className="h-3 w-3 mr-1" />Participantes ({participantes.length})</TabsTrigger>
          <TabsTrigger value="checkins"><MapPinCheck className="h-3 w-3 mr-1" />Check-ins ({checkins.length})</TabsTrigger>
          <TabsTrigger value="followups"><ListChecks className="h-3 w-3 mr-1" />Follow-ups ({followups.length})</TabsTrigger>
          <TabsTrigger value="info"><Info className="h-3 w-3 mr-1" />Detalhes</TabsTrigger>
        </TabsList>

        {/* PARTICIPANTES */}
        <TabsContent value="participantes">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Participantes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Input placeholder="Buscar pessoa para adicionar..." value={pessoaSearch} onChange={(e) => setPessoaSearch(e.target.value)} />
                {pessoaSearch && pessoaResults.length > 0 && (
                  <div className="border rounded max-h-32 overflow-auto">
                    {pessoaResults.slice(0, 5).map((p: any) => (
                      <button key={p.id} className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent/50" onClick={() => handleAddParticipante(p.id, p.full_name)}>
                        {p.full_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2 max-h-[400px] overflow-auto">
                {participantes.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded bg-accent/30">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{p.pessoas?.full_name}</span>
                      <Badge variant="secondary" className="text-[10px]">{papelParticipanteLabels[p.papel]}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-xs">
                        <Checkbox checked={p.confirmado} onCheckedChange={(v) => updateParticipante.mutate({ id: p.id, agendaId, confirmado: !!v })} />Confirmado
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        <Checkbox checked={p.presente} onCheckedChange={(v) => updateParticipante.mutate({ id: p.id, agendaId, presente: !!v })} />Presente
                      </label>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteParticipante.mutate({ id: p.id, agendaId })}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
                {participantes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum participante.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CHECKINS */}
        <TabsContent value="checkins">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Check-ins GPS</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={() => handleCheckin("checkin")} disabled={createCheckin.isPending} className="flex-1">
                  <MapPinCheck className="h-4 w-4 mr-1" />Check-in
                </Button>
                <Button variant="outline" onClick={() => handleCheckin("checkout")} disabled={createCheckin.isPending} className="flex-1">
                  <MapPinCheck className="h-4 w-4 mr-1" />Check-out
                </Button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-auto">
                {checkins.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded bg-accent/30">
                    <div className="flex items-center gap-2">
                      <Badge variant={c.tipo === "checkin" ? "default" : "secondary"} className="text-[10px]">{c.tipo === "checkin" ? "Check-in" : "Check-out"}</Badge>
                      <span className="text-xs">{new Date(c.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    {c.latitude && <span className="text-[10px] text-muted-foreground">{c.latitude.toFixed(4)}, {c.longitude?.toFixed(4)}</span>}
                  </div>
                ))}
                {checkins.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum check-in registrado.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FOLLOWUPS */}
        <TabsContent value="followups">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Follow-ups</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input className="flex-1" placeholder="Descrição do follow-up" value={fwDesc} onChange={(e) => setFwDesc(e.target.value)} />
                <Input type="date" className="w-40" value={fwPrazo} onChange={(e) => setFwPrazo(e.target.value)} />
                <Button size="sm" onClick={handleAddFollowup}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-auto">
                {followups.map((fw: any) => (
                  <div key={fw.id} className="flex items-center justify-between p-2 rounded bg-accent/30">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={fw.concluido} onCheckedChange={(v) => updateFollowup.mutate({ id: fw.id, agendaId, concluido: !!v })} />
                      <span className={`text-sm ${fw.concluido ? "line-through text-muted-foreground" : ""}`}>{fw.descricao}</span>
                    </div>
                    {fw.prazo && <span className="text-[10px] text-muted-foreground">{new Date(fw.prazo).toLocaleDateString("pt-BR")}</span>}
                  </div>
                ))}
                {followups.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum follow-up.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INFO */}
        <TabsContent value="info">
          <Card>
            <CardContent className="pt-4 space-y-3">
              {item.descricao && <div><p className="text-xs text-muted-foreground">Descrição</p><p className="text-sm mt-1">{item.descricao}</p></div>}
              {item.observacoes && <div><p className="text-xs text-muted-foreground">Observações</p><p className="text-sm mt-1">{item.observacoes}</p></div>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Município:</span> {(item as any).municipios?.nome || "—"}</div>
                <div><span className="text-muted-foreground text-xs">Bairro:</span> {(item as any).bairros?.nome || "—"}</div>
                <div><span className="text-muted-foreground text-xs">Início:</span> {new Date(item.data_inicio).toLocaleString("pt-BR")}</div>
                <div><span className="text-muted-foreground text-xs">Fim:</span> {item.data_fim ? new Date(item.data_fim).toLocaleString("pt-BR") : "—"}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
