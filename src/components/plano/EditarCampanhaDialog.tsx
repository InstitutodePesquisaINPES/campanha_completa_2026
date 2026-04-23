import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { CampanhaEscopoForm, escopoDoCargo, type CargoEleitoral } from "./CampanhaEscopoForm";
import { useUpdateCampanha, type Campanha } from "@/hooks/useCampanhas";

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

export function EditarCampanhaDialog({ campanha, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const update = useUpdateCampanha();
  const [form, setForm] = useState({
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
    ativa: campanha.ativa ?? false,
  });

  useEffect(() => {
    if (open) {
      setForm({
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
        ativa: campanha.ativa ?? false,
      });
    }
  }, [open, campanha]);

  const escopo = escopoDoCargo(form.cargo);
  const valido = !!form.nome && (escopo === "municipal" ? !!form.municipio_id : !!form.estado_id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1">
            <Pencil className="h-3.5 w-3.5" /> Editar campanha
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar campanha</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Nome da campanha *</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
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
              <Input value={form.numero_urna} onChange={(e) => setForm({ ...form, numero_urna: e.target.value })} />
            </div>
          </div>

          <CampanhaEscopoForm
            cargo={form.cargo}
            estadoId={form.estado_id}
            municipioId={form.municipio_id}
            municipiosFoco={form.municipios_foco_ids}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          />

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
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Meta de votos</Label>
              <Input type="number" value={form.meta_votos} onChange={(e) => setForm({ ...form, meta_votos: +e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Partido (sigla)</Label>
              <Input value={form.partido_sigla} onChange={(e) => setForm({ ...form, partido_sigla: e.target.value.toUpperCase() })} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Campanha ativa</Label>
              <p className="text-xs text-muted-foreground">A ativa aparece por padrão em todo o sistema.</p>
            </div>
            <Switch checked={form.ativa} onCheckedChange={(v) => setForm({ ...form, ativa: v })} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Para regerar o cronograma após mudar datas/cargo, use a aba <strong>Parâmetros</strong> → "Regerar plano".
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            disabled={!valido || update.isPending}
            onClick={async () => {
              if (!valido) {
                toast.error(escopo === "municipal" ? "Selecione um município" : "Selecione um estado");
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
                ativa: form.ativa,
              } as never);
              setOpen(false);
            }}
          >
            {update.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
