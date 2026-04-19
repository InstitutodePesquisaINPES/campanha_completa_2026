import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Send, Plus, Settings2, Loader2, Bot, User as UserIcon } from "lucide-react";
import { useAICopilots, useAIChat, useAIModelos, useUpsertCopilot } from "@/hooks/useAI";
import { useIsAdmin } from "@/hooks/useUserRoles";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CATEGORIAS = ["estrategista","analista","comunicador","juridico","financeiro","territorial","geral"];

export default function CopilotPage() {
  const { data: copilots } = useAICopilots();
  const { data: modelos } = useAIModelos();
  const isAdmin = useIsAdmin();
  const chat = useAIChat();
  const upsertCopilot = useUpsertCopilot();
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [editDialog, setEditDialog] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected && copilots?.length) setSelected(copilots[0]);
  }, [copilots, selected]);

  useEffect(() => { setMessages([]); }, [selected?.id]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !selected) return;
    if (!selected.modelo_id) { toast.error("Este copilot não tem modelo configurado"); return; }
    const userMsg: Msg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    try {
      const res: any = await chat.mutateAsync({ copilot_id: selected.id, messages: newMessages });
      setMessages([...newMessages, { role: "assistant", content: res.content }]);
    } catch (e: any) {
      toast.error(e.message);
      setMessages(newMessages);
    }
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-8rem)]">
        {/* Sidebar copilots */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4" />Copilots</CardTitle>
              {isAdmin && (
                <Button size="sm" variant="ghost" onClick={() => setEditDialog({ ativo: true, temperatura: 0.7, max_tokens: 2048, categoria: "geral", prompt_sistema: "" })}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="space-y-1 pt-0">
              {copilots?.map((c: any) => (
                <button key={c.id} onClick={() => setSelected(c)} className={`w-full text-left p-2.5 rounded-lg transition-colors ${selected?.id === c.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm truncate" style={{ color: c.cor }}>{c.nome}</div>
                    {isAdmin && <Settings2 className="h-3 w-3 text-muted-foreground shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); setEditDialog(c); }} />}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{c.descricao}</div>
                  <Badge variant="outline" className="text-[10px] mt-1">{c.categoria}</Badge>
                </button>
              ))}
              {!copilots?.length && <p className="text-xs text-muted-foreground p-2">Nenhum copilot. Admin pode criar.</p>}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Chat */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">{selected?.nome ?? "Selecione um copilot"}</CardTitle>
            <CardDescription className="text-xs">
              {selected?.ai_modelos ? `${selected.ai_modelos.ai_provedores?.nome} / ${selected.ai_modelos.nome}` : "Sem modelo configurado — admin precisa atribuir"}
            </CardDescription>
          </CardHeader>
          <ScrollArea className="flex-1" ref={scrollRef as any}>
            <CardContent className="space-y-4 py-4">
              {messages.length === 0 && selected && (
                <div className="text-center text-muted-foreground text-sm py-12">
                  <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  Comece a conversar com {selected.nome}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-lg p-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {chat.isPending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Pensando...</div>}
            </CardContent>
          </ScrollArea>
          <div className="border-t p-3 flex gap-2">
            <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Pergunte algo..." rows={2} className="resize-none" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} disabled={chat.isPending || !selected} />
            <Button onClick={send} disabled={chat.isPending || !input.trim() || !selected}><Send className="h-4 w-4" /></Button>
          </div>
        </Card>
      </div>

      {/* Edit copilot */}
      <Dialog open={!!editDialog} onOpenChange={o => !o && setEditDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editDialog?.id ? "Editar" : "Novo"} Copilot</DialogTitle></DialogHeader>
          {editDialog && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={editDialog.nome ?? ""} onChange={e => setEditDialog({ ...editDialog, nome: e.target.value })} /></div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={editDialog.categoria} onValueChange={v => setEditDialog({ ...editDialog, categoria: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Descrição</Label><Input value={editDialog.descricao ?? ""} onChange={e => setEditDialog({ ...editDialog, descricao: e.target.value })} /></div>
              <div>
                <Label>Modelo</Label>
                <Select value={editDialog.modelo_id ?? ""} onValueChange={v => setEditDialog({ ...editDialog, modelo_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {modelos?.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.ai_provedores?.nome} / {m.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Prompt do sistema</Label><Textarea value={editDialog.prompt_sistema ?? ""} onChange={e => setEditDialog({ ...editDialog, prompt_sistema: e.target.value })} rows={6} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Temperatura</Label><Input type="number" step="0.1" min="0" max="2" value={editDialog.temperatura} onChange={e => setEditDialog({ ...editDialog, temperatura: Number(e.target.value) })} /></div>
                <div><Label>Max tokens</Label><Input type="number" value={editDialog.max_tokens} onChange={e => setEditDialog({ ...editDialog, max_tokens: Number(e.target.value) })} /></div>
                <div><Label>Cor</Label><Input type="color" value={editDialog.cor ?? "#3B82F6"} onChange={e => setEditDialog({ ...editDialog, cor: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={editDialog.ativo ?? true} onCheckedChange={c => setEditDialog({ ...editDialog, ativo: c })} />Ativo</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button onClick={() => upsertCopilot.mutate(editDialog, { onSuccess: () => setEditDialog(null) })}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
