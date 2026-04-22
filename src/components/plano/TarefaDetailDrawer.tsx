import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateTarefa, type Tarefa } from "@/hooks/useCampanhas";
import {
  useTarefaAnexos,
  useUploadTarefaAnexo,
  useDeleteTarefaAnexo,
  getSignedUrl,
  type TarefaAnexo,
} from "@/hooks/useTarefaAnexos";
import {
  useSubtarefas,
  useCreateSubtarefa,
  useUpdateSubtarefa,
  useDeleteSubtarefa,
} from "@/hooks/useSubtarefas";
import {
  FileText, Upload, Download, Trash2, CalendarDays, Clock, Flag,
  ScrollText, ListChecks, Info, ShieldCheck, ShieldAlert, User, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { RespaldoLegalPicker } from "./RespaldoLegalPicker";

const FASE_LEGAL_OPTS = [
  { value: "pre_campanha_legal", label: "Pré-campanha (até registro TSE)" },
  { value: "campanha_oficial", label: "Campanha oficial (pós-registro)" },
  { value: "pos_eleicao", label: "Pós-eleição" },
];

const STATUS_OPTS = [
  { value: "pendente", label: "A fazer" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "atrasada", label: "Atrasada" },
];

const TIPOS_DOC = ["contrato", "ata", "comprovante", "proposta", "oficio", "midia", "outros"];

type TarefaExt = Tarefa & {
  observacoes?: string | null;
  fase_legal?: "pre_campanha_legal" | "campanha_oficial" | "pos_eleicao" | null;
  respaldo_legal?: string | null;
  o_que_e?: string | null;
  o_que_faz?: string | null;
  entregaveis?: string | null;
  is_marco?: boolean | null;
  responsavel_papel?: string | null;
  permitido_antes_registro?: boolean | null;
};

function FaseLegalBadge({ fase, permitido }: { fase?: string | null; permitido?: boolean | null }) {
  if (fase === "campanha_oficial") {
    return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-[10px]">Campanha oficial · pós-registro TSE</Badge>;
  }
  if (fase === "pos_eleicao") {
    return <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">Pós-eleição</Badge>;
  }
  return (
    <Badge variant="outline" className={`text-[10px] ${permitido === false ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-info/10 text-info border-info/30"}`}>
      Pré-campanha (até registro 15/08)
    </Badge>
  );
}

export function TarefaDetailDrawer({
  tarefa,
  open,
  onOpenChange,
  canManage,
}: {
  tarefa: Tarefa | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canManage: boolean;
}) {
  const update = useUpdateTarefa();
  const { data: anexos = [] } = useTarefaAnexos(tarefa?.id);
  const upload = useUploadTarefaAnexo();
  const remove = useDeleteTarefaAnexo();

  const { data: subs = [] } = useSubtarefas(tarefa?.id);
  const createSub = useCreateSubtarefa();
  const updateSub = useUpdateSubtarefa();
  const deleteSub = useDeleteSubtarefa();

  const [file, setFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("outros");
  const [obs, setObs] = useState("");
  const [novaSub, setNovaSub] = useState("");

  if (!tarefa) return null;
  const tx = tarefa as TarefaExt;

  const handleDownload = async (a: TarefaAnexo) => {
    try {
      const url = await getSignedUrl(a.storage_path);
      window.open(url, "_blank");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const subDone = subs.filter((s) => s.concluida).length;
  const subPct = subs.length ? Math.round((subDone / subs.length) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg flex items-start gap-2">
            {tx.is_marco && <Flag className="h-5 w-5 text-warning shrink-0 mt-0.5" />}
            <span>{tarefa.titulo}</span>
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2 text-xs flex-wrap">
            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(tarefa.data_prevista).toLocaleDateString("pt-BR")}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Dia {tarefa.dia} · Semana {tarefa.semana}</span>
            <Badge variant="outline" className="capitalize text-[10px]">{tarefa.area}</Badge>
            <Badge variant="outline" className="capitalize text-[10px]">{tarefa.prioridade}</Badge>
            <FaseLegalBadge fase={tx.fase_legal} permitido={tx.permitido_antes_registro} />
            {tx.is_marco && <Badge className="bg-warning text-warning-foreground text-[10px]">MARCO</Badge>}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={tarefa.status}
                disabled={!canManage}
                onValueChange={(v) =>
                  update.mutate({
                    id: tarefa.id,
                    status: v as never,
                    data_conclusao: v === "concluida" ? new Date().toISOString() : null,
                  })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {tx.responsavel_papel && (
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><User className="h-3 w-3" />Responsável</Label>
                <div className="text-sm border rounded-md px-3 h-10 flex items-center bg-muted/30">{tx.responsavel_papel}</div>
              </div>
            )}
          </div>

          <Tabs defaultValue="visao">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="visao" className="gap-1 text-xs"><Info className="h-3 w-3" />Visão</TabsTrigger>
              <TabsTrigger value="subs" className="gap-1 text-xs"><ListChecks className="h-3 w-3" />Checklist {subs.length > 0 && `(${subDone}/${subs.length})`}</TabsTrigger>
              <TabsTrigger value="legal" className="gap-1 text-xs"><ScrollText className="h-3 w-3" />Legal</TabsTrigger>
              <TabsTrigger value="docs" className="gap-1 text-xs"><FileText className="h-3 w-3" />Docs ({anexos.length})</TabsTrigger>
            </TabsList>

            {/* VISÃO GERAL */}
            <TabsContent value="visao" className="space-y-4 mt-4">
              {tx.o_que_e && (
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">O que é</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{tx.o_que_e}</p>
                </div>
              )}
              {tx.o_que_faz && (
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">O que faz / como executar</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{tx.o_que_faz}</p>
                </div>
              )}
              {tx.entregaveis && (
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entregáveis</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap font-mono text-xs bg-muted/40 p-3 rounded-md">{tx.entregaveis}</p>
                </div>
              )}
              {tarefa.descricao && !tx.o_que_e && (
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap text-muted-foreground">{tarefa.descricao}</p>
                </div>
              )}
              <Separator />
              <div className="space-y-1.5">
                <Label className="text-xs">Observações da execução</Label>
                <Textarea
                  defaultValue={tx.observacoes ?? ""}
                  placeholder="Notas sobre o andamento, decisões, próximos passos..."
                  disabled={!canManage}
                  rows={4}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val !== (tx.observacoes ?? "")) {
                      update.mutate({ id: tarefa.id, observacoes: val } as never);
                    }
                  }}
                />
              </div>
            </TabsContent>

            {/* CHECKLIST / SUBTAREFAS */}
            <TabsContent value="subs" className="space-y-3 mt-4">
              {subs.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{subDone}/{subs.length} · {subPct}%</span>
                  </div>
                  <Progress value={subPct} className="h-2" />
                </div>
              )}
              <div className="space-y-1.5">
                {subs.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 p-2 border rounded-md hover:bg-accent/40">
                    <Checkbox
                      checked={s.concluida}
                      disabled={!canManage}
                      onCheckedChange={(c) => updateSub.mutate({ id: s.id, concluida: !!c })}
                    />
                    <span className={`text-sm flex-1 ${s.concluida ? "line-through text-muted-foreground" : ""}`}>{s.titulo}</span>
                    {canManage && (
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => deleteSub.mutate({ id: s.id, tarefa_id: tarefa.id })}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {subs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Sem itens. Adicione um abaixo.</p>
                )}
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <Input
                    value={novaSub}
                    onChange={(e) => setNovaSub(e.target.value)}
                    placeholder="Novo item de checklist..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && novaSub.trim()) {
                        createSub.mutate({
                          tarefa_id: tarefa.id,
                          campanha_id: tarefa.campanha_id,
                          titulo: novaSub.trim(),
                          ordem: subs.length,
                        });
                        setNovaSub("");
                      }
                    }}
                    className="h-9"
                  />
                  <Button
                    size="sm"
                    disabled={!novaSub.trim() || createSub.isPending}
                    onClick={() => {
                      createSub.mutate({
                        tarefa_id: tarefa.id,
                        campanha_id: tarefa.campanha_id,
                        titulo: novaSub.trim(),
                        ordem: subs.length,
                      });
                      setNovaSub("");
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* RESPALDO LEGAL */}
            <TabsContent value="legal" className="space-y-3 mt-4">
              <div className={`rounded-md border p-3 ${tx.permitido_antes_registro === false ? "bg-destructive/5 border-destructive/30" : "bg-success/5 border-success/30"}`}>
                <div className="flex items-center gap-2 mb-1">
                  {tx.permitido_antes_registro === false ? (
                    <><ShieldAlert className="h-4 w-4 text-destructive" /><span className="text-xs font-semibold text-destructive">Apenas após registro de candidatura no TSE</span></>
                  ) : (
                    <><ShieldCheck className="h-4 w-4 text-success" /><span className="text-xs font-semibold text-success">Permitido na pré-campanha</span></>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {tx.permitido_antes_registro === false
                    ? "Esta ação só pode ser executada após o pedido de registro (até 15/08 do ano eleitoral)."
                    : "Ação enquadrada como ato preparatório legítimo. Não envolve pedido explícito de voto nem captação de recursos."}
                </p>
              </div>
              {tx.respaldo_legal ? (
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Respaldo legal</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap leading-relaxed">{tx.respaldo_legal}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">Sem respaldo legal cadastrado para esta tarefa.</p>
              )}
              <p className="text-[10px] text-muted-foreground border-t pt-2">
                Referências: Lei 9.504/97 · Resoluções TSE 23.607/2019, 23.609/2019, 23.610/2019.
              </p>
            </TabsContent>

            {/* DOCUMENTOS */}
            <TabsContent value="docs" className="space-y-3 mt-4">
              {canManage && (
                <div className="rounded-md border p-3 space-y-2 bg-muted/30">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">Título</Label>
                      <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Contrato Coordenador" className="h-8" />
                    </div>
                    <div>
                      <Label className="text-[11px]">Tipo</Label>
                      <Select value={tipo} onValueChange={setTipo}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIPOS_DOC.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px]">Observação (opcional)</Label>
                    <Input value={obs} onChange={(e) => setObs(e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Arquivo</Label>
                    <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="h-9" />
                  </div>
                  <Button
                    size="sm" className="w-full gap-1"
                    disabled={!file || !titulo || upload.isPending}
                    onClick={async () => {
                      if (!file || !titulo) return;
                      await upload.mutateAsync({
                        tarefa_id: tarefa.id,
                        campanha_id: tarefa.campanha_id,
                        titulo,
                        descricao: obs || undefined,
                        tipo_documento: tipo,
                        file,
                      });
                      setFile(null); setTitulo(""); setObs(""); setTipo("outros");
                    }}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {upload.isPending ? "Enviando..." : "Enviar anexo"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground">Os anexos também aparecem no módulo Documentos.</p>
                </div>
              )}

              {anexos.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum documento anexado.</p>
              ) : (
                <div className="space-y-1.5">
                  {anexos.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 p-2 border rounded-md hover:bg-accent/40">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.titulo}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {a.arquivo_nome} · {a.tipo_documento} · {new Date(a.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(a)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      {canManage && (
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => { if (confirm(`Remover "${a.titulo}"?`)) remove.mutate(a); }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
