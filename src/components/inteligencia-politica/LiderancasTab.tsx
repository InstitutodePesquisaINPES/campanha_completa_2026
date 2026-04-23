import { useState } from "react";
import { useLiderancas, useLiderancaStats, useUpsertLideranca, useDeleteLideranca, type LiderancaClassificacao, type LiderancaStatus, type LiderancaTipo } from "@/hooks/useInteligenciaPolitica";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit, Users, Crown, Search, Heart, Building2, Briefcase, Vote, UserPlus, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePromoverLiderancaParaCRM } from "@/hooks/useInteligenciaAcoes";
import { Link } from "react-router-dom";

const CLASS_COLOR: Record<LiderancaClassificacao, string> = {
  A: "bg-success/15 text-success border-success/40",
  B: "bg-info/15 text-info border-info/40",
  C: "bg-warning/15 text-warning border-warning/40",
  D: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABEL: Record<LiderancaStatus, string> = {
  mapeado: "Mapeado",
  contactado: "Contactado",
  reuniao_marcada: "Reunião marcada",
  comprometido: "Comprometido",
  aliado: "Aliado",
  neutro: "Neutro",
  adversario: "Adversário",
};

const TIPO_LABEL: Record<LiderancaTipo, string> = {
  religiosa: "Religiosa",
  associativa: "Associativa",
  politica: "Política",
  comunitaria: "Comunitária",
  empresarial: "Empresarial",
  sindical: "Sindical",
  cultural: "Cultural",
  esportiva: "Esportiva",
  familiar: "Familiar",
  profissional: "Profissional",
};

export function LiderancasTab({ campanhaId }: { campanhaId: string }) {
  const [filters, setFilters] = useState<any>({ campanhaId });
  const [busca, setBusca] = useState("");
  const { data: liderancas = [], isLoading } = useLiderancas(filters);
  const { data: stats } = useLiderancaStats(campanhaId);
  const upsert = useUpsertLideranca();
  const del = useDeleteLideranca();
  const promover = usePromoverLiderancaParaCRM();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: municipios = [] } = useQuery({
    queryKey: ["municipios-list"],
    queryFn: async () => {
      const { data } = await supabase.from("municipios").select("id, nome").order("nome").limit(500);
      return data ?? [];
    },
  });

  const { data: bairros = [] } = useQuery({
    queryKey: ["bairros-by-mun", editing?.municipio_id],
    enabled: !!editing?.municipio_id,
    queryFn: async () => {
      const { data } = await supabase.from("bairros").select("id, nome").eq("municipio_id", editing.municipio_id).order("nome").limit(500);
      return data ?? [];
    },
  });

  const filtered = liderancas.filter((l: any) =>
    !busca || l.nome.toLowerCase().includes(busca.toLowerCase()) || l.apelido?.toLowerCase().includes(busca.toLowerCase())
  );

  function startNew() {
    setEditing({
      campanha_id: campanhaId, nome: "", tipo: "comunitaria", status: "mapeado",
      tem_familia_grande: false, presidente_associacao: false, lider_religioso: false,
      profissao_influente: false, ja_foi_candidato: false,
      tamanho_familia_estimado: 0, num_membros_associacao: 0, num_fieis_estimado: 0,
      votos_estimados: 0, rede_contatos_estimada: 0,
    });
    setOpen(true);
  }

  function startEdit(row: any) {
    setEditing({ ...row });
    setOpen(true);
  }

  async function save() {
    if (!editing.nome) return;
    await upsert.mutateAsync(editing);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card><CardContent className="p-4"><Users className="h-4 w-4 text-primary mb-1" /><div className="text-2xl font-bold">{stats?.total ?? 0}</div><p className="text-xs text-muted-foreground">Lideranças</p></CardContent></Card>
        <Card><CardContent className="p-4"><Crown className="h-4 w-4 text-success mb-1" /><div className="text-2xl font-bold text-success">{stats?.porClass.A ?? 0}</div><p className="text-xs text-muted-foreground">Classe A</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-info">{stats?.porClass.B ?? 0}</div><p className="text-xs text-muted-foreground">Classe B</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-warning">{stats?.porClass.C ?? 0}</div><p className="text-xs text-muted-foreground">Classe C</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-muted-foreground">{stats?.porClass.D ?? 0}</div><p className="text-xs text-muted-foreground">Classe D</p></CardContent></Card>
        <Card><CardContent className="p-4"><Vote className="h-4 w-4 text-primary mb-1" /><div className="text-2xl font-bold">{stats?.totalVotos.toLocaleString() ?? 0}</div><p className="text-xs text-muted-foreground">Votos estimados</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle className="text-base">Lideranças locais</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome..." className="pl-7 h-8 w-48" />
              </div>
              <Select value={filters.classificacao ?? "all"} onValueChange={(v) => setFilters({ ...filters, classificacao: v === "all" ? undefined : v })}>
                <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Classe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas classes</SelectItem>
                  <SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem><SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.tipo ?? "all"} onValueChange={(v) => setFilters({ ...filters, tipo: v === "all" ? undefined : v })}>
                <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos tipos</SelectItem>
                  {Object.entries(TIPO_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={startNew}><Plus className="h-4 w-4 mr-1" /> Nova</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Liderança</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Município/Bairro</TableHead>
                  <TableHead>Características</TableHead>
                  <TableHead className="text-right">Votos est.</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {l.foto_url && <AvatarImage src={l.foto_url} />}
                          <AvatarFallback className="text-xs">{l.nome.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{l.nome}</p>
                          {l.apelido && <p className="text-[10px] text-muted-foreground">"{l.apelido}"</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{TIPO_LABEL[l.tipo as LiderancaTipo]}</Badge></TableCell>
                    <TableCell className="text-xs">
                      {l.municipio?.nome}<br />
                      <span className="text-muted-foreground">{l.bairro?.nome}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {l.tem_familia_grande && <Badge variant="secondary" className="text-[9px] h-5"><Heart className="h-2.5 w-2.5 mr-0.5" />Família {l.tamanho_familia_estimado}</Badge>}
                        {l.presidente_associacao && <Badge variant="secondary" className="text-[9px] h-5"><Building2 className="h-2.5 w-2.5 mr-0.5" />{l.num_membros_associacao}</Badge>}
                        {l.lider_religioso && <Badge variant="secondary" className="text-[9px] h-5">⛪ {l.num_fieis_estimado}</Badge>}
                        {l.profissao_influente && <Badge variant="secondary" className="text-[9px] h-5"><Briefcase className="h-2.5 w-2.5 mr-0.5" />{l.profissao}</Badge>}
                        {l.ja_foi_candidato && <Badge variant="secondary" className="text-[9px] h-5"><Vote className="h-2.5 w-2.5 mr-0.5" />{l.votos_recebidos_anterior ?? 0}v</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{l.votos_estimados.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{Number(l.influencia_score).toFixed(0)}</TableCell>
                    <TableCell><Badge variant="outline" className={CLASS_COLOR[l.classificacao as LiderancaClassificacao]}>{l.classificacao}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{STATUS_LABEL[l.status as LiderancaStatus]}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {l.pessoa_id ? (
                          <Button size="icon" variant="ghost" asChild title="Ver no CRM">
                            <Link to={`/pessoas?id=${l.pessoa_id}`}><ExternalLink className="h-3.5 w-3.5 text-info" /></Link>
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" onClick={() => promover.mutate(l)} disabled={promover.isPending} title="Promover ao CRM">
                            <UserPlus className="h-3.5 w-3.5 text-success" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => startEdit(l)} title="Editar"><Edit className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => del.mutate(l.id)} title="Remover"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma liderança cadastrada ainda.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Nova"} liderança</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome completo *</Label><Input value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></div>
                <div><Label>Apelido</Label><Input value={editing.apelido ?? ""} onChange={(e) => setEditing({ ...editing, apelido: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={editing.telefone ?? ""} onChange={(e) => setEditing({ ...editing, telefone: e.target.value })} /></div>
                <div><Label>WhatsApp</Label><Input value={editing.whatsapp ?? ""} onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })} /></div>
                <div>
                  <Label>Município</Label>
                  <Select value={editing.municipio_id ?? ""} onValueChange={(v) => setEditing({ ...editing, municipio_id: v, bairro_id: null })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{municipios.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Select value={editing.bairro_id ?? ""} onValueChange={(v) => setEditing({ ...editing, bairro_id: v })} disabled={!editing.municipio_id}>
                    <SelectTrigger><SelectValue placeholder={editing.municipio_id ? "Selecione" : "Escolha município primeiro"} /></SelectTrigger>
                    <SelectContent>{bairros.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de liderança</Label>
                  <Select value={editing.tipo} onValueChange={(v) => setEditing({ ...editing, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TIPO_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-3">
                <h4 className="text-sm font-semibold">Características de influência</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between"><Label className="text-xs">Família grande?</Label><Switch checked={editing.tem_familia_grande} onCheckedChange={(v) => setEditing({ ...editing, tem_familia_grande: v })} /></div>
                  {editing.tem_familia_grande && <div><Label className="text-xs">Tamanho família estimado</Label><Input type="number" value={editing.tamanho_familia_estimado} onChange={(e) => setEditing({ ...editing, tamanho_familia_estimado: Number(e.target.value) })} /></div>}

                  <div className="flex items-center justify-between"><Label className="text-xs">Presidente de associação?</Label><Switch checked={editing.presidente_associacao} onCheckedChange={(v) => setEditing({ ...editing, presidente_associacao: v })} /></div>
                  {editing.presidente_associacao && <div className="space-y-2"><Input placeholder="Nome da associação" value={editing.nome_associacao ?? ""} onChange={(e) => setEditing({ ...editing, nome_associacao: e.target.value })} /><Input type="number" placeholder="Nº membros" value={editing.num_membros_associacao} onChange={(e) => setEditing({ ...editing, num_membros_associacao: Number(e.target.value) })} /></div>}

                  <div className="flex items-center justify-between"><Label className="text-xs">Líder religioso?</Label><Switch checked={editing.lider_religioso} onCheckedChange={(v) => setEditing({ ...editing, lider_religioso: v })} /></div>
                  {editing.lider_religioso && <div className="space-y-2"><Input placeholder="Igreja/denominação" value={editing.igreja_denominacao ?? ""} onChange={(e) => setEditing({ ...editing, igreja_denominacao: e.target.value })} /><Input type="number" placeholder="Nº fiéis" value={editing.num_fieis_estimado} onChange={(e) => setEditing({ ...editing, num_fieis_estimado: Number(e.target.value) })} /></div>}

                  <div className="flex items-center justify-between"><Label className="text-xs">Profissão influente?</Label><Switch checked={editing.profissao_influente} onCheckedChange={(v) => setEditing({ ...editing, profissao_influente: v })} /></div>
                  {editing.profissao_influente && <div><Input placeholder="Profissão" value={editing.profissao ?? ""} onChange={(e) => setEditing({ ...editing, profissao: e.target.value })} /></div>}

                  <div className="flex items-center justify-between"><Label className="text-xs">Já foi candidato?</Label><Switch checked={editing.ja_foi_candidato} onCheckedChange={(v) => setEditing({ ...editing, ja_foi_candidato: v })} /></div>
                  {editing.ja_foi_candidato && <div><Input type="number" placeholder="Votos recebidos" value={editing.votos_recebidos_anterior ?? 0} onChange={(e) => setEditing({ ...editing, votos_recebidos_anterior: Number(e.target.value) })} /></div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Votos estimados que pode entregar</Label><Input type="number" value={editing.votos_estimados} onChange={(e) => setEditing({ ...editing, votos_estimados: Number(e.target.value) })} /></div>
                <div><Label>Rede de contatos</Label><Input type="number" value={editing.rede_contatos_estimada} onChange={(e) => setEditing({ ...editing, rede_contatos_estimada: Number(e.target.value) })} /></div>
              </div>

              <div><Label>Observações</Label><Textarea rows={3} value={editing.observacoes ?? ""} onChange={(e) => setEditing({ ...editing, observacoes: e.target.value })} /></div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={upsert.isPending || !editing.nome}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
