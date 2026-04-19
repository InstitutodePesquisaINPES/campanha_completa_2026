import { useState } from "react";
import { usePessoa, useUpdatePessoa, useContatos, useCreateContato, useDeleteContato, useEnderecos, useCreateEndereco, useDeleteEndereco, usePapeis, useCreatePapel, useDeletePapel, useHistorico, useCreateHistorico, useConsentimentos, useCreateConsentimento } from "@/hooks/usePessoas";
import { useMunicipios, useBairros } from "@/hooks/useTerritorio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Trash2, Phone, MapPin, UserCheck, Clock, Shield } from "lucide-react";

const nivelLabels: Record<string, string> = { desconhecido: "Desconhecido", frio: "Frio", morno: "Morno", quente: "Quente", aliado: "Aliado", lideranca: "Liderança" };
const nivelColors: Record<string, string> = { desconhecido: "bg-gray-500/15 text-gray-400", frio: "bg-blue-500/15 text-blue-400", morno: "bg-yellow-500/15 text-yellow-400", quente: "bg-orange-500/15 text-orange-400", aliado: "bg-green-500/15 text-green-400", lideranca: "bg-purple-500/15 text-purple-400" };
const tipoContatoLabels: Record<string, string> = { celular: "Celular", fixo: "Fixo", whatsapp: "WhatsApp", email: "E-mail", instagram: "Instagram", facebook: "Facebook", twitter: "Twitter" };
const papelLabels: Record<string, string> = { eleitor: "Eleitor", apoiador: "Apoiador", lideranca: "Liderança", coordenador_bairro: "Coord. Bairro", doador: "Doador", fornecedor: "Fornecedor", imprensa: "Imprensa", institucional: "Institucional", demandante: "Demandante", equipe: "Equipe" };
const tipoInteracaoLabels: Record<string, string> = { ligacao: "Ligação", visita: "Visita", whatsapp: "WhatsApp", email: "E-mail", reuniao: "Reunião", evento: "Evento" };
const finalidadeLabels: Record<string, string> = { comunicacao_politica: "Comunicação Política", pesquisa: "Pesquisa", campanha: "Campanha", mandato: "Mandato" };

type NivelRelacionamento = "desconhecido" | "frio" | "morno" | "quente" | "aliado" | "lideranca";

export function PessoaDetail({ pessoaId, onBack }: { pessoaId: string; onBack: () => void }) {
  const { toast } = useToast();
  const { data: pessoa, isLoading } = usePessoa(pessoaId);
  const updatePessoa = useUpdatePessoa();
  const { data: contatos = [] } = useContatos(pessoaId);
  const { data: enderecos = [] } = useEnderecos(pessoaId);
  const { data: papeis = [] } = usePapeis(pessoaId);
  const { data: historico = [] } = useHistorico(pessoaId);
  const { data: consentimentos = [] } = useConsentimentos(pessoaId);
  const createContato = useCreateContato();
  const deleteContato = useDeleteContato();
  const createEndereco = useCreateEndereco();
  const deleteEndereco = useDeleteEndereco();
  const createPapel = useCreatePapel();
  const deletePapel = useDeletePapel();
  const createHistorico = useCreateHistorico();
  const createConsentimento = useCreateConsentimento();

  // Contato form
  const [cForm, setCForm] = useState({ tipo: "celular" as any, valor: "" });
  // Papel form
  const [pForm, setPForm] = useState({ papel: "eleitor" as any });
  // Histórico form
  const [hForm, setHForm] = useState({ tipo: "ligacao" as any, resumo: "", resultado: "" });
  // Consentimento form
  const [lgpdForm, setLgpdForm] = useState({ finalidade: "comunicacao_politica" as any, consentido: true, canal_coleta: "" });
  // Endereço form
  const [eForm, setEForm] = useState({ logradouro: "", numero: "", cep: "", municipio_id: "", bairro_id: "", tipo: "residencial" as any });

  const { data: municipios = [] } = useMunicipios();
  const { data: bairros = [] } = useBairros(eForm.municipio_id || undefined);

  if (isLoading || !pessoa) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const handleUpdateNivel = async (nivel: NivelRelacionamento) => {
    try {
      await updatePessoa.mutateAsync({ id: pessoaId, nivel_relacionamento: nivel });
      toast({ title: "Nível atualizado!" });
    } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
  };

  const isPJ = (pessoa as any).tipo_pessoa === "pj";
  const displayName = isPJ
    ? ((pessoa as any).nome_fantasia || (pessoa as any).razao_social || pessoa.full_name)
    : pessoa.full_name;
  const fmtCnpj = (cnpj: string | null) => {
    if (!cnpj) return null;
    const c = cnpj.replace(/\D/g, "").padStart(14, "0");
    return `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12,14)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{isPJ ? "PJ" : "PF"}</Badge>
            <h2 className="text-xl font-bold">{displayName}</h2>
          </div>
          {isPJ ? (
            <p className="text-xs text-muted-foreground">
              CNPJ: {fmtCnpj((pessoa as any).cnpj) || "Não informado"}
              {(pessoa as any).razao_social && (pessoa as any).razao_social !== displayName && ` · ${(pessoa as any).razao_social}`}
              {(pessoa as any).segmento && ` · ${(pessoa as any).segmento}`}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">CPF: {pessoa.cpf ? `***.***${pessoa.cpf.slice(6, 9)}-${pessoa.cpf.slice(9)}` : "Não informado"}</p>
          )}
        </div>
        <Select value={pessoa.nivel_relacionamento} onValueChange={(v) => handleUpdateNivel(v as NivelRelacionamento)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(nivelLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
        </Select>
        <Badge variant="outline" className={nivelColors[pessoa.nivel_relacionamento] || ""}>{nivelLabels[pessoa.nivel_relacionamento]}</Badge>
      </div>

      <Tabs defaultValue="contatos">
        <TabsList className="flex-wrap">
          <TabsTrigger value="contatos"><Phone className="h-3 w-3 mr-1" />Contatos ({contatos.length})</TabsTrigger>
          <TabsTrigger value="enderecos"><MapPin className="h-3 w-3 mr-1" />Endereços ({enderecos.length})</TabsTrigger>
          <TabsTrigger value="papeis"><UserCheck className="h-3 w-3 mr-1" />Papéis ({papeis.length})</TabsTrigger>
          <TabsTrigger value="historico"><Clock className="h-3 w-3 mr-1" />Histórico ({historico.length})</TabsTrigger>
          <TabsTrigger value="lgpd"><Shield className="h-3 w-3 mr-1" />LGPD ({consentimentos.length})</TabsTrigger>
        </TabsList>

        {/* CONTATOS */}
        <TabsContent value="contatos">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contatos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={cForm.tipo} onValueChange={(v) => setCForm({ ...cForm, tipo: v })}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(tipoContatoLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
                <Input className="flex-1" placeholder="Valor do contato" value={cForm.valor} onChange={(e) => setCForm({ ...cForm, valor: e.target.value })} />
                <Button size="sm" onClick={async () => {
                  if (!cForm.valor.trim()) return;
                  try { await createContato.mutateAsync({ pessoa_id: pessoaId, tipo: cForm.tipo, valor: cForm.valor.trim() }); setCForm({ ...cForm, valor: "" }); toast({ title: "Contato adicionado!" }); }
                  catch (e: any) { toast({ variant: "destructive", description: e.message }); }
                }} disabled={createContato.isPending}><Plus className="h-4 w-4" /></Button>
              </div>
              {contatos.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded bg-accent/30">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{tipoContatoLabels[c.tipo] || c.tipo}</Badge>
                    <span className="text-sm">{c.valor}</span>
                    {c.principal && <Badge className="text-[10px] bg-primary/20 text-primary">Principal</Badge>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteContato.mutate({ id: c.id, pessoaId })}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENDEREÇOS */}
        <TabsContent value="enderecos">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Endereços</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Select value={eForm.municipio_id} onValueChange={(v) => setEForm({ ...eForm, municipio_id: v, bairro_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Município" /></SelectTrigger>
                  <SelectContent>{municipios.map((m: any) => (<SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>))}</SelectContent>
                </Select>
                <Select value={eForm.bairro_id} onValueChange={(v) => setEForm({ ...eForm, bairro_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Bairro" /></SelectTrigger>
                  <SelectContent>{bairros.map((b: any) => (<SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Input className="flex-1" placeholder="Logradouro" value={eForm.logradouro} onChange={(e) => setEForm({ ...eForm, logradouro: e.target.value })} />
                <Input className="w-20" placeholder="Nº" value={eForm.numero} onChange={(e) => setEForm({ ...eForm, numero: e.target.value })} />
                <Input className="w-28" placeholder="CEP" value={eForm.cep} onChange={(e) => setEForm({ ...eForm, cep: e.target.value })} />
                <Button size="sm" onClick={async () => {
                  try {
                    await createEndereco.mutateAsync({ pessoa_id: pessoaId, logradouro: eForm.logradouro || undefined, numero: eForm.numero || undefined, cep: eForm.cep || undefined, municipio_id: eForm.municipio_id || undefined, bairro_id: eForm.bairro_id || undefined, tipo: eForm.tipo });
                    setEForm({ logradouro: "", numero: "", cep: "", municipio_id: "", bairro_id: "", tipo: "residencial" });
                    toast({ title: "Endereço adicionado!" });
                  } catch (e: any) { toast({ variant: "destructive", description: e.message }); }
                }}><Plus className="h-4 w-4" /></Button>
              </div>
              {enderecos.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded bg-accent/30">
                  <div className="text-sm">
                    <Badge variant="secondary" className="text-[10px] mr-1">{e.tipo}</Badge>
                    {[e.logradouro, e.numero].filter(Boolean).join(", ") || "Sem logradouro"}
                    {e.bairros?.nome && <span className="text-muted-foreground"> — {(e as any).bairros?.nome}</span>}
                    {e.municipios?.nome && <span className="text-muted-foreground">, {(e as any).municipios?.nome}</span>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteEndereco.mutate({ id: e.id, pessoaId })}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAPÉIS */}
        <TabsContent value="papeis">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Papéis</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={pForm.papel} onValueChange={(v) => setPForm({ papel: v })}>
                  <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(papelLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
                <Button size="sm" onClick={async () => {
                  try { await createPapel.mutateAsync({ pessoa_id: pessoaId, papel: pForm.papel }); toast({ title: "Papel adicionado!" }); }
                  catch (e: any) { toast({ variant: "destructive", description: e.message }); }
                }}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {papeis.map((p: any) => (
                  <Badge key={p.id} variant={p.ativo ? "default" : "secondary"} className="gap-1 pr-1">
                    {papelLabels[p.papel] || p.papel}
                    <button onClick={() => deletePapel.mutate({ id: p.id, pessoaId })} className="ml-1 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTÓRICO */}
        <TabsContent value="historico">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Timeline de Contatos</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={hForm.tipo} onValueChange={(v) => setHForm({ ...hForm, tipo: v })}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(tipoInteracaoLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
                <Input className="flex-1" placeholder="Resumo" value={hForm.resumo} onChange={(e) => setHForm({ ...hForm, resumo: e.target.value })} />
                <Button size="sm" onClick={async () => {
                  try { await createHistorico.mutateAsync({ pessoa_id: pessoaId, tipo: hForm.tipo, resumo: hForm.resumo || undefined, resultado: hForm.resultado || undefined }); setHForm({ tipo: "ligacao", resumo: "", resultado: "" }); toast({ title: "Interação registrada!" }); }
                  catch (e: any) { toast({ variant: "destructive", description: e.message }); }
                }}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-auto">
                {historico.map((h: any) => (
                  <div key={h.id} className="p-3 rounded bg-accent/30 border-l-2 border-primary">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{tipoInteracaoLabels[h.tipo] || h.tipo}</Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(h.data_contato).toLocaleString("pt-BR")}</span>
                    </div>
                    {h.resumo && <p className="text-sm">{h.resumo}</p>}
                    {h.resultado && <p className="text-xs text-muted-foreground mt-1">Resultado: {h.resultado}</p>}
                  </div>
                ))}
                {historico.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma interação registrada.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LGPD */}
        <TabsContent value="lgpd">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Consentimentos LGPD</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={lgpdForm.finalidade} onValueChange={(v) => setLgpdForm({ ...lgpdForm, finalidade: v })}>
                  <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(finalidadeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
                <Input className="flex-1" placeholder="Canal de coleta (ex: formulário web)" value={lgpdForm.canal_coleta} onChange={(e) => setLgpdForm({ ...lgpdForm, canal_coleta: e.target.value })} />
                <Button size="sm" variant={lgpdForm.consentido ? "default" : "destructive"} onClick={async () => {
                  try { await createConsentimento.mutateAsync({ pessoa_id: pessoaId, finalidade: lgpdForm.finalidade, consentido: lgpdForm.consentido, canal_coleta: lgpdForm.canal_coleta || undefined }); toast({ title: "Consentimento registrado!" }); }
                  catch (e: any) { toast({ variant: "destructive", description: e.message }); }
                }}><Plus className="h-4 w-4 mr-1" />{lgpdForm.consentido ? "Consentir" : "Revogar"}</Button>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Finalidade</TableHead><TableHead>Status</TableHead><TableHead>Canal</TableHead><TableHead>Data</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {consentimentos.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs">{finalidadeLabels[c.finalidade] || c.finalidade}</TableCell>
                      <TableCell><Badge variant={c.consentido ? "default" : "destructive"} className="text-[10px]">{c.consentido ? "Consentido" : "Revogado"}</Badge></TableCell>
                      <TableCell className="text-xs">{c.canal_coleta || "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(c.created_at).toLocaleString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {consentimentos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum consentimento registrado.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
