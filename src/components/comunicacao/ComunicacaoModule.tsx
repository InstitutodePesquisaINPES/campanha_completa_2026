import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePessoas } from "@/hooks/usePessoas";
import { useTags } from "@/hooks/usePessoas";
import { MessageSquare, Send, Users, Filter, Copy, Check, Calendar, Library, Radio } from "lucide-react";
import { toast } from "sonner";
import { CalendarioEditorialTab } from "./CalendarioEditorialTab";
import { BibliotecaPecasTab } from "./BibliotecaPecasTab";
import { WarRoomTab } from "./WarRoomTab";

const templates = [
  { id: "convite_evento", nome: "Convite para Evento", corpo: "Olá {nome}! Você está convidado(a) para {evento} no dia {data} às {hora}. Local: {local}. Contamos com sua presença!" },
  { id: "retorno_demanda", nome: "Retorno de Demanda", corpo: "Olá {nome}! Sobre sua demanda #{protocolo}, informamos que {status_msg}. Qualquer dúvida, estamos à disposição." },
  { id: "agradecimento", nome: "Agradecimento", corpo: "Olá {nome}! Agradecemos sua participação e apoio. Juntos somos mais fortes! Abraço." },
  { id: "aniversario", nome: "Aniversário", corpo: "Parabéns {nome}! 🎉 Desejamos muita saúde e felicidade neste dia especial!" },
  { id: "convocacao", nome: "Convocação Reunião", corpo: "Olá {nome}! Convocamos para reunião dia {data} às {hora} no {local}. Pauta: {pauta}. Confirme presença." },
];

export function ComunicacaoModule() {
  const [tab, setTab] = useState("calendario");
  const { data: pessoas } = usePessoas();
  const { data: tags } = useTags();
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [mensagem, setMensagem] = useState(templates[0].corpo);
  const [filterNivel, setFilterNivel] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [copied, setCopied] = useState(false);

  const nivelOptions = ["desconhecido", "frio", "morno", "quente", "aliado", "lideranca"];
  const nivelLabels: Record<string, string> = { desconhecido: "Desconhecido", frio: "Frio", morno: "Morno", quente: "Quente", aliado: "Aliado", lideranca: "Liderança" };

  // Filter pessoas with whatsapp/celular contacts
  const pessoasComContato = pessoas?.filter(p => {
    const contatos = (p as any).pessoas_contatos || [];
    const hasPhone = contatos.some((c: any) => ["celular", "whatsapp"].includes(c.tipo));
    if (!hasPhone) return false;
    if (filterNivel !== "all" && p.nivel_relacionamento !== filterNivel) return false;
    if (filterTag !== "all") {
      const ptags = (p as any).pessoas_tags || [];
      if (!ptags.some((t: any) => t.tag_id === filterTag)) return false;
    }
    return true;
  }) || [];

  const handleCopyAll = () => {
    const lines = pessoasComContato.map(p => {
      const contatos = (p as any).pessoas_contatos || [];
      const phone = contatos.find((c: any) => ["whatsapp", "celular"].includes(c.tipo))?.valor || "";
      const msg = mensagem.replace("{nome}", p.full_name);
      return `${p.full_name}\t${phone}\t${msg}`;
    }).join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true);
    toast.success(`${pessoasComContato.length} contatos copiados!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Comunicação</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="calendario"><Calendar className="h-4 w-4 mr-1" />Calendário Editorial</TabsTrigger>
          <TabsTrigger value="biblioteca"><Library className="h-4 w-4 mr-1" />Biblioteca de Peças</TabsTrigger>
          <TabsTrigger value="warroom"><Radio className="h-4 w-4 mr-1" />War Room</TabsTrigger>
          <TabsTrigger value="templates"><MessageSquare className="h-4 w-4 mr-1" />Templates</TabsTrigger>
          <TabsTrigger value="disparar"><Send className="h-4 w-4 mr-1" />Preparar Disparo</TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="mt-4"><CalendarioEditorialTab /></TabsContent>
        <TabsContent value="biblioteca" className="mt-4"><BibliotecaPecasTab /></TabsContent>
        <TabsContent value="warroom" className="mt-4"><WarRoomTab /></TabsContent>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <Card key={t.id} className={`cursor-pointer transition-all hover:border-primary ${selectedTemplate.id === t.id ? "border-primary ring-1 ring-primary" : ""}`}
                onClick={() => { setSelectedTemplate(t); setMensagem(t.corpo); }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{t.nome}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground line-clamp-3">{t.corpo}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Editor de Mensagem</CardTitle>
              <CardDescription className="text-xs">Use variáveis: {"{nome}"}, {"{evento}"}, {"{data}"}, {"{hora}"}, {"{local}"}, {"{protocolo}"}, {"{pauta}"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={5} className="font-mono text-sm" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disparar" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" />Filtrar Destinatários</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Nível Relacionamento</label>
                <Select value={filterNivel} onValueChange={setFilterNivel}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {nivelOptions.map(n => <SelectItem key={n} value={n}>{nivelLabels[n]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Tag</label>
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {tags?.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {pessoasComContato.length} destinatários com WhatsApp/Celular
                </CardTitle>
                <Button size="sm" onClick={handleCopyAll} disabled={pessoasComContato.length === 0}>
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Copiado!" : "Copiar Lista"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pessoasComContato.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma pessoa encontrada com os filtros selecionados e contato WhatsApp/Celular.</p>
              ) : (
                <div className="max-h-72 overflow-auto space-y-1">
                  {pessoasComContato.slice(0, 50).map(p => {
                    const contatos = (p as any).pessoas_contatos || [];
                    const phone = contatos.find((c: any) => ["whatsapp", "celular"].includes(c.tipo))?.valor || "";
                    return (
                      <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 text-sm">
                        <span>{p.full_name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{p.nivel_relacionamento}</Badge>
                          <span className="text-xs text-muted-foreground font-mono">{phone}</span>
                        </div>
                      </div>
                    );
                  })}
                  {pessoasComContato.length > 50 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">+ {pessoasComContato.length - 50} mais...</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Preview da Mensagem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap">
                {mensagem.replace("{nome}", pessoasComContato[0]?.full_name || "Maria Silva")}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
