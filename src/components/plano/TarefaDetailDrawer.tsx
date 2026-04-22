import { useState, useRef, useCallback, useEffect } from "react";
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
  Loader2, Check, History, Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { RespaldoLegalPicker } from "./RespaldoLegalPicker";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

// Campos rastreados pelo histórico inline
const TRACKED_FIELDS: Record<string, string> = {
  fase_legal: "Fase legal",
  is_marco: "Marco",
  o_que_e: "O que é",
  o_que_faz: "O que faz",
  entregaveis: "Entregáveis",
  respaldo_legal: "Respaldo legal",
  responsavel_papel: "Responsável",
  permitido_antes_registro: "Permitido antes do registro",
};

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

type FieldStatus = "idle" | "saving" | "saved" | "error";

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

function SaveIndicator({ status }: { status: FieldStatus }) {
  if (status === "saving") return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-label="Salvando" />;
  if (status === "saved") return <Check className="h-3 w-3 text-success" aria-label="Salvo" />;
  if (status === "error") return <ShieldAlert className="h-3 w-3 text-destructive" aria-label="Erro" />;
  return null;
}

// Normaliza texto de entregáveis: remove linhas vazias do meio, trim por linha
function normalizeEntregaveis(raw: string): string {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l, i, arr) => l !== "" || i === arr.length - 1)
    .join("\n")
    .trim();
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

  // Estado de salvamento por campo
  const [fieldStatus, setFieldStatus] = useState<Record<string, FieldStatus>>({});
  const setStatus = useCallback((field: string, s: FieldStatus) => {
    setFieldStatus((prev) => ({ ...prev, [field]: s }));
    if (s === "saved") {
      setTimeout(() => setFieldStatus((p) => (p[field] === "saved" ? { ...p, [field]: "idle" } : p)), 1800);
    }
  }, []);

  // Snapshot dos valores originais para "Desfazer alterações"
  const originalRef = useRef<TarefaExt | null>(null);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (tarefa && (!originalRef.current || originalRef.current.id !== tarefa.id)) {
      originalRef.current = { ...(tarefa as TarefaExt) };
      setDirtyFields(new Set());
      setFieldStatus({});
    }
  }, [tarefa]);

  // Histórico de auditoria
  const { data: historico = [], refetch: refetchHistorico } = useQuery({
    queryKey: ["tarefa-historico", tarefa?.id],
    enabled: !!tarefa?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, user_id, new_data, old_data, created_at")
        .eq("table_name", "campanha_tarefas")
        .eq("record_id", tarefa!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Salva campo com indicador + validação + tracking (antes do early return p/ Hook order)
  const saveField = useCallback(
    async (field: string, value: unknown, opts?: { validate?: () => string | null }) => {
      if (!tarefa) return;
      const err = opts?.validate?.();
      if (err) {
        setStatus(field, "error");
        toast.error(err);
        return;
      }
      setStatus(field, "saving");
      setDirtyFields((prev) => new Set(prev).add(field));
      try {
        await update.mutateAsync({ id: tarefa.id, [field]: value } as never);
        setStatus(field, "saved");
        if (TRACKED_FIELDS[field]) refetchHistorico();
      } catch (e) {
        setStatus(field, "error");
        toast.error(`Falha ao salvar ${TRACKED_FIELDS[field] ?? field}: ${(e as Error).message}`);
      }
    },
    [tarefa, update, setStatus, refetchHistorico],
  );

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

  // Desfazer todas as alterações inline
  const handleUndoAll = async () => {
    const orig = originalRef.current;
    if (!orig || dirtyFields.size === 0) return;
    if (!confirm(`Reverter ${dirtyFields.size} alteração(ões) feitas neste drawer?`)) return;
    const patch: Record<string, unknown> = {};
    dirtyFields.forEach((f) => {
      patch[f] = (orig as unknown as Record<string, unknown>)[f] ?? null;
    });
    try {
      await update.mutateAsync({ id: tarefa.id, ...patch } as never);
      setDirtyFields(new Set());
      setFieldStatus({});
      toast.success("Alterações revertidas.");
      refetchHistorico();
    } catch (e) {
      toast.error(`Falha ao reverter: ${(e as Error).message}`);
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
          {canManage && dirtyFields.size > 0 && (
            <div className="flex items-center justify-between gap-2 mt-2 p-2 rounded-md bg-warning/10 border border-warning/30">
              <span className="text-[11px] text-warning font-medium">
                {dirtyFields.size} campo{dirtyFields.size > 1 ? "s" : ""} alterado{dirtyFields.size > 1 ? "s" : ""} nesta sessão
              </span>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={handleUndoAll} disabled={update.isPending}>
                <Undo2 className="h-3 w-3" />Desfazer alterações
              </Button>
            </div>
          )}
        </SheetHeader>

        <div className="space-y-4 mt-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">Status <SaveIndicator status={fieldStatus.status ?? "idle"} /></Label>
              <Select
                value={tarefa.status}
                disabled={!canManage}
                onValueChange={(v) => {
                  setStatus("status", "saving");
                  update
                    .mutateAsync({
                      id: tarefa.id,
                      status: v as never,
                      data_conclusao: v === "concluida" ? new Date().toISOString() : null,
                    } as never)
                    .then(() => setStatus("status", "saved"))
                    .catch(() => setStatus("status", "error"));
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><User className="h-3 w-3" />Responsável <SaveIndicator status={fieldStatus.responsavel_papel ?? "idle"} /></Label>
              <Input
                defaultValue={tx.responsavel_papel ?? ""}
                placeholder="Ex: Coordenador de campo"
                disabled={!canManage}
                className="h-10"
                maxLength={120}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val === (tx.responsavel_papel ?? "")) return;
                  saveField("responsavel_papel", val || null, {
                    validate: () => (val.length > 120 ? "Responsável deve ter no máximo 120 caracteres." : null),
                  });
                }}
              />
            </div>
          </div>

          {/* Linha 2: fase legal + marco */}
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">Fase legal <SaveIndicator status={fieldStatus.fase_legal ?? "idle"} /></Label>
              <Select
                value={tx.fase_legal ?? "pre_campanha_legal"}
                disabled={!canManage}
                onValueChange={(v) => saveField("fase_legal", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FASE_LEGAL_OPTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 border rounded-md px-3 h-10 bg-muted/20">
              <Flag className={`h-4 w-4 ${tx.is_marco ? "text-warning" : "text-muted-foreground"}`} />
              <Label className="text-xs cursor-pointer">Marco</Label>
              <Switch
                checked={!!tx.is_marco}
                disabled={!canManage}
                onCheckedChange={(c) => saveField("is_marco", c)}
              />
              <SaveIndicator status={fieldStatus.is_marco ?? "idle"} />
            </div>
          </div>

          <Tabs defaultValue="visao">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="visao" className="gap-1 text-xs"><Info className="h-3 w-3" />Visão</TabsTrigger>
              <TabsTrigger value="subs" className="gap-1 text-xs"><ListChecks className="h-3 w-3" />Checklist {subs.length > 0 && `(${subDone}/${subs.length})`}</TabsTrigger>
              <TabsTrigger value="legal" className="gap-1 text-xs"><ScrollText className="h-3 w-3" />Legal</TabsTrigger>
              <TabsTrigger value="docs" className="gap-1 text-xs"><FileText className="h-3 w-3" />Docs ({anexos.length})</TabsTrigger>
              <TabsTrigger value="hist" className="gap-1 text-xs"><History className="h-3 w-3" />Hist.</TabsTrigger>
            </TabsList>

            {/* VISÃO GERAL */}
            <TabsContent value="visao" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  O que é <SaveIndicator status={fieldStatus.o_que_e ?? "idle"} />
                </Label>
                <Textarea
                  defaultValue={tx.o_que_e ?? ""}
                  placeholder="Descreva o que é esta tarefa..."
                  disabled={!canManage}
                  rows={2}
                  maxLength={1000}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v === (tx.o_que_e ?? "")) return;
                    saveField("o_que_e", v || null, {
                      validate: () => (v.length > 1000 ? "Máximo 1000 caracteres." : null),
                    });
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  O que faz / como executar <SaveIndicator status={fieldStatus.o_que_faz ?? "idle"} />
                </Label>
                <Textarea
                  defaultValue={tx.o_que_faz ?? ""}
                  placeholder="Passo a passo de execução..."
                  disabled={!canManage}
                  rows={3}
                  maxLength={2000}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v === (tx.o_que_faz ?? "")) return;
                    saveField("o_que_faz", v || null, {
                      validate: () => (v.length > 2000 ? "Máximo 2000 caracteres." : null),
                    });
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  Entregáveis <SaveIndicator status={fieldStatus.entregaveis ?? "idle"} />
                </Label>
                <Textarea
                  defaultValue={tx.entregaveis ?? ""}
                  placeholder="Um por linha. Ex: Ata assinada · Lista de presença"
                  disabled={!canManage}
                  rows={3}
                  maxLength={2000}
                  className="font-mono text-xs"
                  onBlur={(e) => {
                    const normalized = normalizeEntregaveis(e.target.value);
                    if (normalized !== (tx.entregaveis ?? "").trim()) {
                      // Atualiza o campo visualmente para o usuário ver a normalização
                      e.target.value = normalized;
                      saveField("entregaveis", normalized || null, {
                        validate: () => (normalized.length > 2000 ? "Máximo 2000 caracteres." : null),
                      });
                    }
                  }}
                />
                <p className="text-[10px] text-muted-foreground">Quebras de linha em branco são removidas automaticamente.</p>
              </div>
              {tarefa.descricao && !tx.o_que_e && (
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição original</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap text-muted-foreground">{tarefa.descricao}</p>
                </div>
              )}
              <Separator />
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">Observações da execução <SaveIndicator status={fieldStatus.observacoes ?? "idle"} /></Label>
                <Textarea
                  defaultValue={tx.observacoes ?? ""}
                  placeholder="Notas sobre o andamento, decisões, próximos passos..."
                  disabled={!canManage}
                  rows={4}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val !== (tx.observacoes ?? "")) {
                      saveField("observacoes" as keyof TarefaExt, val);
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
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {tx.permitido_antes_registro === false ? (
                      <><ShieldAlert className="h-4 w-4 text-destructive" /><span className="text-xs font-semibold text-destructive">Apenas após registro TSE</span></>
                    ) : (
                      <><ShieldCheck className="h-4 w-4 text-success" /><span className="text-xs font-semibold text-success">Permitido na pré-campanha</span></>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-[11px] cursor-pointer">Permitido antes do registro</Label>
                    <Switch
                      checked={tx.permitido_antes_registro !== false}
                      disabled={!canManage}
                      onCheckedChange={(c) => saveField("permitido_antes_registro", c)}
                    />
                    <SaveIndicator status={fieldStatus.permitido_antes_registro ?? "idle"} />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {tx.permitido_antes_registro === false
                    ? "Esta ação só pode ser executada após o pedido de registro (até 15/08 do ano eleitoral)."
                    : "Ação enquadrada como ato preparatório legítimo. Não envolve pedido explícito de voto nem captação de recursos."}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    Respaldo legal <SaveIndicator status={fieldStatus.respaldo_legal ?? "idle"} />
                  </Label>
                  {canManage && (
                    <RespaldoLegalPicker
                      onPick={(ref) => {
                        const atual = tx.respaldo_legal ?? "";
                        const linha = `${ref.norma} — ${ref.ementa}`;
                        // Evita duplicar referência
                        if (atual.includes(ref.norma)) {
                          toast.info("Esta referência já está presente.");
                          return;
                        }
                        const novo = atual ? `${atual}\n\n${linha}` : linha;
                        saveField("respaldo_legal", novo);
                      }}
                      triggerLabel="Buscar referência"
                    />
                  )}
                </div>
                {canManage ? (
                  <Textarea
                    defaultValue={tx.respaldo_legal ?? ""}
                    key={tx.respaldo_legal ?? "empty"}
                    placeholder="Cite a base legal (Lei 9.504/97, Resoluções TSE...) ou use o botão acima."
                    rows={5}
                    maxLength={3000}
                    className="text-sm leading-relaxed"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v === (tx.respaldo_legal ?? "").trim()) return;
                      saveField("respaldo_legal", v || null, {
                        validate: () => (v.length > 3000 ? "Máximo 3000 caracteres." : null),
                      });
                    }}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{tx.respaldo_legal || "—"}</p>
                )}
              </div>
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

            {/* HISTÓRICO */}
            <TabsContent value="hist" className="space-y-2 mt-4">
              <p className="text-[11px] text-muted-foreground">
                Últimas alterações registradas (fase legal, marco, o que é/faz, entregáveis, respaldo legal e responsável).
              </p>
              {historico.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhum registro de auditoria encontrado.</p>
              ) : (
                <div className="space-y-1.5">
                  {historico.map((h) => {
                    const oldD = (h.old_data ?? {}) as Record<string, unknown>;
                    const newD = (h.new_data ?? {}) as Record<string, unknown>;
                    const changes = Object.keys(TRACKED_FIELDS).filter(
                      (k) => JSON.stringify(oldD[k]) !== JSON.stringify(newD[k]),
                    );
                    if (h.action === "UPDATE" && changes.length === 0) return null;
                    return (
                      <div key={h.id} className="border rounded-md p-2 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] capitalize">{h.action.toLowerCase()}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(h.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate">
                          user: {h.user_id ? h.user_id.slice(0, 8) : "sistema"}
                        </div>
                        {changes.length > 0 && (
                          <ul className="space-y-0.5 mt-1">
                            {changes.map((k) => (
                              <li key={k} className="text-[11px]">
                                <span className="font-semibold">{TRACKED_FIELDS[k]}:</span>{" "}
                                <span className="line-through text-muted-foreground">{String(oldD[k] ?? "—").slice(0, 60)}</span>{" "}
                                <span className="text-foreground">→ {String(newD[k] ?? "—").slice(0, 60)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
