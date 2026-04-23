import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Pencil, User as UserIcon, MapPin, Vote, Wallet, Scale, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import { CampanhaEscopoForm, escopoDoCargo, type CargoEleitoral } from "./CampanhaEscopoForm";
import { useUpdateCampanha, type Campanha } from "@/hooks/useCampanhas";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const cargos: { v: CargoEleitoral; l: string }[] = [
  { v: "vereador", l: "Vereador" },
  { v: "prefeito", l: "Prefeito" },
  { v: "vice_prefeito", l: "Vice-Prefeito" },
  { v: "deputado_estadual", l: "Deputado Estadual" },
  { v: "deputado_federal", l: "Deputado Federal" },
  { v: "senador", l: "Senador" },
  { v: "governador", l: "Governador" },
  { v: "presidente", l: "Presidente" },
];

interface Props {
  campanha: Campanha & { municipios_foco_ids?: string[] | null };
  trigger?: React.ReactNode;
}

function CandidatoPicker({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: pessoas = [] } = useQuery({
    queryKey: ["pessoas-picker", search],
    queryFn: async () => {
      let q = supabase.from("pessoas").select("id, full_name").order("full_name").limit(20);
      if (search.trim()) q = q.ilike("full_name", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as { id: string; full_name: string }[];
    },
  });

  const { data: selected } = useQuery({
    queryKey: ["pessoa-selected", value],
    enabled: !!value,
    queryFn: async () => {
      const { data } = await supabase.from("pessoas").select("id, full_name").eq("id", value!).maybeSingle();
      return data;
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="justify-between w-full font-normal">
          <span className="truncate">{selected?.full_name ?? "Vincular candidato (CRM)"}</span>
          <UserIcon className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar pessoa..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem onSelect={() => { onChange(null); setOpen(false); }} className="text-destructive">
                  Remover vínculo
                </CommandItem>
              )}
              {pessoas.map((p) => (
                <CommandItem key={p.id} onSelect={() => { onChange(p.id); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === p.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex-1 text-sm">{p.full_name}</div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function EditarCampanhaDialog({ campanha, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const update = useUpdateCampanha();
  const [tab, setTab] = useState("identidade");

  const initial = useMemo(() => ({
    nome: campanha.nome ?? "",
    cargo: (campanha.cargo as CargoEleitoral) ?? "vereador",
    data_eleicao: campanha.data_eleicao ?? "",
    data_inicio_plano: campanha.data_inicio_plano ?? "",
    estado_id: campanha.estado_id ?? "",
    municipio_id: campanha.municipio_id ?? "",
    municipios_foco_ids: (campanha.municipios_foco_ids as string[]) ?? [],
    meta_votos: campanha.meta_votos ?? 0,
    numero_urna: campanha.numero_urna ?? "",
    partido_sigla: campanha.partido_sigla ?? "",
    coligacao: (campanha as Campanha).coligacao ?? "",
    candidato_pessoa_id: (campanha as Campanha).candidato_pessoa_id ?? null,
    orcamento_total: Number((campanha as Campanha).orcamento_total ?? 0),
    observacoes: (campanha as Campanha).observacoes ?? "",
    ativa: campanha.ativa ?? false,
  }), [campanha]);

  const [form, setForm] = useState(initial);

  useEffect(() => { if (open) { setForm(initial); setTab("identidade"); } }, [open, initial]);

  const escopo = escopoDoCargo(form.cargo);
  const valido = !!form.nome && (escopo === "municipal" ? !!form.municipio_id : !!form.estado_id);

  const duracao = form.data_inicio_plano && form.data_eleicao
    ? Math.max(1, Math.ceil((new Date(form.data_eleicao).getTime() - new Date(form.data_inicio_plano).getTime()) / 86400000))
    : null;

  const submit = async () => {
    if (!valido) {
      toast.error(escopo === "municipal" ? "Selecione um município" : "Selecione um estado");
      setTab("territorio");
      return;
    }
    await update.mutateAsync({
      id: campanha.id,
      nome: form.nome,
      cargo: form.cargo as never,
      data_eleicao: form.data_eleicao,
      data_inicio_plano: form.data_inicio_plano,
      estado_id: form.estado_id || null,
      municipio_id: form.municipio_id || null,
      municipios_foco_ids: form.municipios_foco_ids as never,
      meta_votos: form.meta_votos,
      numero_urna: form.numero_urna || null,
      partido_sigla: form.partido_sigla || null,
      coligacao: form.coligacao?.trim() || null,
      candidato_pessoa_id: form.candidato_pessoa_id || null,
      orcamento_total: form.orcamento_total || null,
      observacoes: form.observacoes?.trim() || null,
      ativa: form.ativa,
    } as never);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1">
            <Pencil className="h-3.5 w-3.5" /> Editar campanha
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" /> Editar campanha · {campanha.nome}
          </DialogTitle>
          <DialogDescription>
            Todos os campos são editáveis. Mudar datas/cargo? Regenere o plano em <strong>Parâmetros</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-1">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="identidade" className="gap-1 text-xs"><Vote className="h-3 w-3" />Identidade</TabsTrigger>
              <TabsTrigger value="candidato" className="gap-1 text-xs"><UserIcon className="h-3 w-3" />Candidato</TabsTrigger>
              <TabsTrigger value="territorio" className="gap-1 text-xs"><MapPin className="h-3 w-3" />Território</TabsTrigger>
              <TabsTrigger value="estrategia" className="gap-1 text-xs"><Scale className="h-3 w-3" />Estratégia</TabsTrigger>
              <TabsTrigger value="notas" className="gap-1 text-xs"><FileText className="h-3 w-3" />Notas</TabsTrigger>
            </TabsList>

            <TabsContent value="identidade" className="space-y-3 mt-4">
              <div className="grid gap-1.5">
                <Label>Nome da campanha *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: João Silva 2026" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Cargo *</Label>
                  <Select
                    value={form.cargo}
                    onValueChange={(v) => setForm({ ...form, cargo: v as CargoEleitoral, estado_id: "", municipio_id: "", municipios_foco_ids: [] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {cargos.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Nº Urna</Label>
                  <Input value={form.numero_urna} onChange={(e) => setForm({ ...form, numero_urna: e.target.value })} placeholder="Ex.: 70123" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Início do plano</Label>
                  <Input type="date" value={form.data_inicio_plano} onChange={(e) => setForm({ ...form, data_inicio_plano: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Data da eleição *</Label>
                  <Input type="date" value={form.data_eleicao} onChange={(e) => setForm({ ...form, data_eleicao: e.target.value })} />
                </div>
              </div>
              {duracao && (
                <p className="text-[11px] text-muted-foreground">Duração total do plano: <strong>{duracao} dias</strong></p>
              )}
              <div className="flex items-center justify-between rounded-md border p-3 bg-accent/30">
                <div>
                  <Label>Campanha ativa</Label>
                  <p className="text-xs text-muted-foreground">A ativa aparece por padrão em todo o sistema.</p>
                </div>
                <Switch checked={form.ativa} onCheckedChange={(v) => setForm({ ...form, ativa: v })} />
              </div>
            </TabsContent>

            <TabsContent value="candidato" className="space-y-3 mt-4">
              <div className="grid gap-1.5">
                <Label>Vincular pessoa do CRM (candidato/a)</Label>
                <CandidatoPicker
                  value={form.candidato_pessoa_id}
                  onChange={(id) => setForm({ ...form, candidato_pessoa_id: id })}
                />
                <p className="text-[11px] text-muted-foreground">Vinculando, dados de contato/agenda aparecem no Comando.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Partido (sigla)</Label>
                  <Input value={form.partido_sigla} onChange={(e) => setForm({ ...form, partido_sigla: e.target.value.toUpperCase().slice(0, 12) })} placeholder="AVANTE" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Coligação / Federação</Label>
                  <Input value={form.coligacao} onChange={(e) => setForm({ ...form, coligacao: e.target.value })} placeholder="Ex.: Federação Brasil da Esperança" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground border-l-2 border-info pl-2 italic">
                Conforme Lei 9.504/97 art. 6º, coligações só são permitidas em eleições majoritárias. Para proporcional (vereador/deputado), use Federação partidária (Lei 9.096/95).
              </p>
            </TabsContent>

            <TabsContent value="territorio" className="space-y-3 mt-4">
              <CampanhaEscopoForm
                cargo={form.cargo}
                estadoId={form.estado_id}
                municipioId={form.municipio_id}
                municipiosFoco={form.municipios_foco_ids}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
              />
            </TabsContent>

            <TabsContent value="estrategia" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Meta de votos</Label>
                  <Input type="number" min={0} value={form.meta_votos} onChange={(e) => setForm({ ...form, meta_votos: +e.target.value })} />
                  <p className="text-[10px] text-muted-foreground">Usada nos KPIs e cálculo de cadastros/visitas/fiscais.</p>
                </div>
                <div className="grid gap-1.5">
                  <Label className="flex items-center gap-1"><Wallet className="h-3 w-3" />Orçamento total (R$)</Label>
                  <Input type="number" min={0} step={1000} value={form.orcamento_total} onChange={(e) => setForm({ ...form, orcamento_total: +e.target.value })} />
                  <p className="text-[10px] text-muted-foreground">Limite legal varia por cargo (Res. TSE 23.607/19 + atualizações).</p>
                </div>
              </div>
              {form.meta_votos > 0 && form.orcamento_total > 0 && (
                <div className="rounded-md border p-3 bg-muted/30 text-xs space-y-1">
                  <p>📊 <strong>Custo por voto projetado:</strong> R$ {(form.orcamento_total / form.meta_votos).toFixed(2)}</p>
                  <p>💼 <strong>Sugestão de fiscais (D-1):</strong> ~{Math.ceil(form.meta_votos / 250)} (1 a cada 250 votos meta)</p>
                  <p>🚪 <strong>Sugestão de cadastros:</strong> ~{Math.ceil(form.meta_votos * 0.3).toLocaleString("pt-BR")} (30% da meta)</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="notas" className="space-y-3 mt-4">
              <div className="grid gap-1.5">
                <Label>Observações estratégicas</Label>
                <Textarea
                  rows={8}
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  placeholder="Posicionamento, narrativa, slogan, adversários, riscos, decisões de coordenação..."
                />
                <p className="text-[10px] text-muted-foreground">Aparece no Resumo Executivo e no Comando.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={!valido || update.isPending} onClick={submit}>
            {update.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
