import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, MapPin, X } from "lucide-react";

export type CargoEleitoral =
  | "vereador" | "prefeito" | "vice_prefeito"
  | "deputado_estadual" | "deputado_federal" | "senador"
  | "governador" | "vice_governador" | "presidente";

// Escopo: municipal exige município; estadual exige estado; federal usa estado opcional + foco em municípios
export function escopoDoCargo(cargo: CargoEleitoral): "municipal" | "estadual" | "federal" {
  if (["vereador", "prefeito", "vice_prefeito"].includes(cargo)) return "municipal";
  if (["deputado_estadual", "governador", "vice_governador", "senador", "deputado_federal"].includes(cargo)) return "estadual";
  return "federal";
}

interface Props {
  cargo: CargoEleitoral;
  estadoId: string;
  municipioId: string;
  municipiosFoco: string[];
  onChange: (patch: { estado_id?: string; municipio_id?: string; municipios_foco_ids?: string[] }) => void;
}

export function CampanhaEscopoForm({ cargo, estadoId, municipioId, municipiosFoco, onChange }: Props) {
  const escopo = escopoDoCargo(cargo);

  const { data: estados = [] } = useQuery({
    queryKey: ["estados-list"],
    queryFn: async () => {
      const { data } = await supabase.from("estados").select("id, sigla, nome").order("nome");
      return data ?? [];
    },
  });

  const { data: municipios = [] } = useQuery({
    queryKey: ["municipios-by-estado", estadoId],
    enabled: !!estadoId,
    queryFn: async () => {
      const { data } = await supabase.from("municipios").select("id, nome").eq("estado_id", estadoId).order("nome").limit(1000);
      return data ?? [];
    },
  });

  const { data: municipiosSemFiltro = [] } = useQuery({
    queryKey: ["municipios-all"],
    enabled: !estadoId && escopo === "municipal",
    queryFn: async () => {
      const { data } = await supabase.from("municipios").select("id, nome").order("nome").limit(1000);
      return data ?? [];
    },
  });

  const municipiosDisponiveis = estadoId ? municipios : municipiosSemFiltro;
  const focoSelecionados = municipiosDisponiveis.filter((m) => municipiosFoco.includes(m.id));

  return (
    <div className="grid gap-3 border rounded-md p-3 bg-muted/30">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        Escopo: <Badge variant="outline" className="capitalize">{escopo}</Badge>
      </div>

      {/* Estado: obrigatório para estadual/federal, opcional para municipal */}
      <div className="grid gap-1.5">
        <Label>
          Estado {escopo !== "municipal" && <span className="text-destructive">*</span>}
        </Label>
        <Select
          value={estadoId || undefined}
          onValueChange={(v) => onChange({ estado_id: v, municipio_id: "", municipios_foco_ids: [] })}
        >
          <SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
          <SelectContent>
            {estados.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.sigla} · {e.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Município: obrigatório só no escopo municipal */}
      {escopo === "municipal" && (
        <div className="grid gap-1.5">
          <Label>Município <span className="text-destructive">*</span></Label>
          <Select value={municipioId || undefined} onValueChange={(v) => onChange({ municipio_id: v })} disabled={!municipiosDisponiveis.length}>
            <SelectTrigger><SelectValue placeholder={estadoId ? "Selecione o município" : "Selecione o estado primeiro (ou escolha qualquer)"} /></SelectTrigger>
            <SelectContent>
              {municipiosDisponiveis.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Municípios de foco: disponível para estadual/federal (e opcional p/ municipais que querem expandir) */}
      {escopo !== "municipal" && (
        <div className="grid gap-1.5">
          <Label>Municípios de foco <span className="text-muted-foreground text-xs">(opcional, priorize regiões)</span></Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start font-normal" disabled={!estadoId}>
                {municipiosFoco.length === 0
                  ? (estadoId ? "Selecionar municípios prioritários" : "Selecione o estado primeiro")
                  : `${municipiosFoco.length} município(s) selecionado(s)`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[320px]" align="start">
              <Command>
                <CommandInput placeholder="Buscar município..." />
                <CommandList>
                  <CommandEmpty>Nenhum encontrado.</CommandEmpty>
                  <CommandGroup>
                    {municipiosDisponiveis.map((m) => {
                      const selected = municipiosFoco.includes(m.id);
                      return (
                        <CommandItem
                          key={m.id}
                          onSelect={() => {
                            const next = selected ? municipiosFoco.filter((id) => id !== m.id) : [...municipiosFoco, m.id];
                            onChange({ municipios_foco_ids: next });
                          }}
                        >
                          <Check className={`h-4 w-4 mr-2 ${selected ? "opacity-100" : "opacity-0"}`} />
                          {m.nome}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {focoSelecionados.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {focoSelecionados.map((m) => (
                <Badge key={m.id} variant="secondary" className="gap-1">
                  {m.nome}
                  <button
                    type="button"
                    onClick={() => onChange({ municipios_foco_ids: municipiosFoco.filter((id) => id !== m.id) })}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
