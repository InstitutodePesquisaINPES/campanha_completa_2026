import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, Plus, Pencil, Trash2, Zap, Check, X, AlertCircle, ExternalLink } from "lucide-react";
import { useAIProvedores, useAIModelos, useUpsertProvedor, useDeleteProvedor, useTestProvedor, useUpsertModelo, useDeleteModelo, useAIUsoLog } from "@/hooks/useAI";

const TIPOS = [
  { v: "openai", label: "OpenAI" },
  { v: "anthropic", label: "Anthropic (Claude)" },
  { v: "google", label: "Google (Gemini)" },
  { v: "groq", label: "Groq" },
  { v: "mistral", label: "Mistral AI" },
  { v: "openrouter", label: "OpenRouter" },
  { v: "deepseek", label: "DeepSeek" },
  { v: "xai", label: "xAI (Grok)" },
  { v: "perplexity", label: "Perplexity" },
  { v: "azure_openai", label: "Azure OpenAI" },
  { v: "cohere", label: "Cohere" },
  { v: "custom", label: "Custom (OpenAI-compatible)" },
];

export function CentralIATab() {
  const { data: provedores } = useAIProvedores();
  const { data: modelos } = useAIModelos();
  const [tab, setTab] = useState("provedores");
  const [provDialog, setProvDialog] = useState<any>(null);
  const [modeloDialog, setModeloDialog] = useState<any>(null);
  const upsertProv = useUpsertProvedor();
  const deleteProv = useDeleteProvedor();
  const testProv = useTestProvedor();
  const upsertModelo = useUpsertModelo();
  const deleteModelo = useDeleteModelo();
  const { data: uso } = useAIUsoLog(20);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><Brain className="h-5 w-5" />Central de Provedores de IA</h2>
        <p className="text-sm text-muted-foreground">Cadastre múltiplos provedores reais (OpenAI, Anthropic, Google, Groq, etc.) com suas próprias chaves de API.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="provedores">Provedores</TabsTrigger>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
          <TabsTrigger value="uso">Uso & Custos</TabsTrigger>
          <TabsTrigger value="ajuda">Como Configurar</TabsTrigger>
        </TabsList>

        <TabsContent value="provedores" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setProvDialog({ tipo: "openai", base_url: "https://api.openai.com/v1", secret_name: "OPENAI_API_KEY", status: "inativo", prioridade: 100, headers_extra: {} })}>
              <Plus className="h-4 w-4 mr-1" />Novo Provedor
            </Button>
          </div>
          <div className="grid gap-3">
            {provedores?.map(p => (
              <Card key={p.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{p.nome}</h3>
                      <Badge variant="outline">{p.tipo}</Badge>
                      <Badge variant={p.status === "ativo" ? "default" : p.status === "erro" ? "destructive" : "secondary"}>
                        {p.status === "ativo" && <Check className="h-3 w-3 mr-0.5" />}
                        {p.status === "erro" && <X className="h-3 w-3 mr-0.5" />}
                        {p.status}
                      </Badge>
                      <code className="text-xs text-muted-foreground">{p.secret_name}</code>
                    </div>
                    {p.descricao && <p className="text-xs text-muted-foreground mt-1">{p.descricao}</p>}
                    {p.ultimo_teste_erro && <p className="text-xs text-destructive mt-1 flex items-start gap-1"><AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />{p.ultimo_teste_erro}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => testProv.mutate(p.id)} disabled={testProv.isPending}>
                      <Zap className="h-3.5 w-3.5 mr-1" />Testar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setProvDialog(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover provedor e seus modelos?")) deleteProv.mutate(p.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="modelos" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setModeloDialog({ ativo: true, contexto_tokens: 8192, max_output_tokens: 4096, custo_input_por_1m: 0, custo_output_por_1m: 0 })}>
              <Plus className="h-4 w-4 mr-1" />Novo Modelo
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>ID Modelo</TableHead>
                  <TableHead>Contexto</TableHead>
                  <TableHead>$ In/1M</TableHead>
                  <TableHead>$ Out/1M</TableHead>
                  <TableHead>Recursos</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelos?.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell><Badge variant="outline">{m.ai_provedores?.nome}</Badge></TableCell>
                    <TableCell><code className="text-xs">{m.modelo_id}</code></TableCell>
                    <TableCell>{(m.contexto_tokens / 1000).toFixed(0)}k</TableCell>
                    <TableCell>${Number(m.custo_input_por_1m).toFixed(2)}</TableCell>
                    <TableCell>${Number(m.custo_output_por_1m).toFixed(2)}</TableCell>
                    <TableCell className="space-x-1">
                      {m.suporta_vision && <Badge variant="secondary" className="text-[10px]">vision</Badge>}
                      {m.suporta_tools && <Badge variant="secondary" className="text-[10px]">tools</Badge>}
                      {m.suporta_reasoning && <Badge variant="secondary" className="text-[10px]">reasoning</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setModeloDialog(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover modelo?")) deleteModelo.mutate(m.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="uso" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Últimas 20 chamadas</CardTitle>
              <CardDescription>Tokens, custo estimado e latência</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Provedor / Modelo</TableHead>
                    <TableHead>Copilot</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Latência</TableHead>
                    <TableHead>OK</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uso?.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="text-xs">{new Date(u.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{u.ai_provedores?.nome} / {u.ai_modelos?.nome}</TableCell>
                      <TableCell className="text-xs">{u.ai_copilots?.nome ?? "-"}</TableCell>
                      <TableCell className="text-xs">{u.tokens_input}↓ {u.tokens_output}↑</TableCell>
                      <TableCell className="text-xs">${Number(u.custo_estimado).toFixed(4)}</TableCell>
                      <TableCell className="text-xs">{u.latencia_ms}ms</TableCell>
                      <TableCell>{u.sucesso ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-destructive" />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ajuda" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Como adicionar uma chave real</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Cadastre o provedor aqui (defina <code>secret_name</code>, ex: <code>OPENAI_API_KEY</code>).</li>
                <li>Vá em <strong>Edge Functions Secrets</strong> e adicione a variável com o mesmo nome e o valor da sua chave real obtida no painel do provedor.</li>
                <li>Volte aqui e clique <strong>Testar</strong> — o status passa para <Badge>ativo</Badge> se a chave funcionar.</li>
                <li>Cadastre os modelos que deseja expor (ou use os que já vieram pré-cadastrados).</li>
                <li>Crie um Copilot ligando-o a um modelo. Pronto, conversas reais começam a funcionar.</li>
              </ol>
              <div className="flex flex-wrap gap-2 pt-2">
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer"><Button size="sm" variant="outline">OpenAI Keys <ExternalLink className="h-3 w-3 ml-1" /></Button></a>
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"><Button size="sm" variant="outline">Anthropic Keys <ExternalLink className="h-3 w-3 ml-1" /></Button></a>
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"><Button size="sm" variant="outline">Google AI Studio <ExternalLink className="h-3 w-3 ml-1" /></Button></a>
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer"><Button size="sm" variant="outline">Groq Keys <ExternalLink className="h-3 w-3 ml-1" /></Button></a>
                <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer"><Button size="sm" variant="outline">OpenRouter Keys <ExternalLink className="h-3 w-3 ml-1" /></Button></a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Provedor */}
      <Dialog open={!!provDialog} onOpenChange={o => !o && setProvDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{provDialog?.id ? "Editar" : "Novo"} Provedor</DialogTitle></DialogHeader>
          {provDialog && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={provDialog.nome ?? ""} onChange={e => setProvDialog({ ...provDialog, nome: e.target.value })} /></div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={provDialog.tipo} onValueChange={v => setProvDialog({ ...provDialog, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIPOS.map(t => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Base URL</Label><Input value={provDialog.base_url ?? ""} onChange={e => setProvDialog({ ...provDialog, base_url: e.target.value })} placeholder="https://api.openai.com/v1" /></div>
              <div>
                <Label>Nome do Secret (env var)</Label>
                <Input value={provDialog.secret_name ?? ""} onChange={e => setProvDialog({ ...provDialog, secret_name: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} placeholder="OPENAI_API_KEY" />
                <p className="text-xs text-muted-foreground mt-1">Adicione este secret em Edge Functions Secrets com o valor da sua chave real.</p>
              </div>
              <div><Label>Descrição</Label><Textarea value={provDialog.descricao ?? ""} onChange={e => setProvDialog({ ...provDialog, descricao: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Prioridade</Label><Input type="number" value={provDialog.prioridade ?? 100} onChange={e => setProvDialog({ ...provDialog, prioridade: Number(e.target.value) })} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={provDialog.status} onValueChange={v => setProvDialog({ ...provDialog, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="erro">Erro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProvDialog(null)}>Cancelar</Button>
            <Button onClick={() => { upsertProv.mutate(provDialog, { onSuccess: () => setProvDialog(null) }); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modelo */}
      <Dialog open={!!modeloDialog} onOpenChange={o => !o && setModeloDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{modeloDialog?.id ? "Editar" : "Novo"} Modelo</DialogTitle></DialogHeader>
          {modeloDialog && (
            <div className="grid gap-3">
              <div>
                <Label>Provedor</Label>
                <Select value={modeloDialog.provedor_id ?? ""} onValueChange={v => setModeloDialog({ ...modeloDialog, provedor_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{provedores?.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome amigável</Label><Input value={modeloDialog.nome ?? ""} onChange={e => setModeloDialog({ ...modeloDialog, nome: e.target.value })} placeholder="GPT-4o" /></div>
                <div><Label>ID do modelo (API)</Label><Input value={modeloDialog.modelo_id ?? ""} onChange={e => setModeloDialog({ ...modeloDialog, modelo_id: e.target.value })} placeholder="gpt-4o" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Contexto (tokens)</Label><Input type="number" value={modeloDialog.contexto_tokens} onChange={e => setModeloDialog({ ...modeloDialog, contexto_tokens: Number(e.target.value) })} /></div>
                <div><Label>Max output</Label><Input type="number" value={modeloDialog.max_output_tokens} onChange={e => setModeloDialog({ ...modeloDialog, max_output_tokens: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>$ Input / 1M tokens (USD)</Label><Input type="number" step="0.01" value={modeloDialog.custo_input_por_1m} onChange={e => setModeloDialog({ ...modeloDialog, custo_input_por_1m: Number(e.target.value) })} /></div>
                <div><Label>$ Output / 1M tokens (USD)</Label><Input type="number" step="0.01" value={modeloDialog.custo_output_por_1m} onChange={e => setModeloDialog({ ...modeloDialog, custo_output_por_1m: Number(e.target.value) })} /></div>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={modeloDialog.suporta_vision ?? false} onCheckedChange={c => setModeloDialog({ ...modeloDialog, suporta_vision: c })} />Vision</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={modeloDialog.suporta_tools ?? false} onCheckedChange={c => setModeloDialog({ ...modeloDialog, suporta_tools: c })} />Tools</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={modeloDialog.suporta_reasoning ?? false} onCheckedChange={c => setModeloDialog({ ...modeloDialog, suporta_reasoning: c })} />Reasoning</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={modeloDialog.ativo ?? true} onCheckedChange={c => setModeloDialog({ ...modeloDialog, ativo: c })} />Ativo</label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModeloDialog(null)}>Cancelar</Button>
            <Button onClick={() => upsertModelo.mutate(modeloDialog, { onSuccess: () => setModeloDialog(null) })}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
