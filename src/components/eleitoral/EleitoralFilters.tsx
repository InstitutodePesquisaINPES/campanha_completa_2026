import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Map, User } from "lucide-react";
import { useAnosDisponiveis, CARGOS_TSE } from "@/hooks/useEleitoralTSE";

export type Modo = "territorio" | "candidato";

export function EleitoralFilters({
  modo, setModo,
  uf, setUf,
  ano, setAno,
  cargo, setCargo,
}: {
  modo: Modo; setModo: (m: Modo) => void;
  uf: string; setUf: (v: string) => void;
  ano: number; setAno: (v: number) => void;
  cargo?: string; setCargo: (v: string | undefined) => void;
}) {
  const { data: anos = [2024, 2022, 2020, 2018] } = useAnosDisponiveis(uf);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border bg-card">
      <ToggleGroup type="single" value={modo} onValueChange={(v) => v && setModo(v as Modo)}>
        <ToggleGroupItem value="territorio" className="gap-1"><Map className="h-3.5 w-3.5" />Por Território</ToggleGroupItem>
        <ToggleGroupItem value="candidato" className="gap-1"><User className="h-3.5 w-3.5" />Por Candidato</ToggleGroupItem>
      </ToggleGroup>

      <div className="h-6 w-px bg-border" />

      <Select value={uf} onValueChange={setUf}>
        <SelectTrigger className="h-9 w-24"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="BA">BA</SelectItem></SelectContent>
      </Select>

      <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
        <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
        <SelectContent>
          {anos.map((a: number) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={cargo ?? "all"} onValueChange={(v) => setCargo(v === "all" ? undefined : v)}>
        <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Cargo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os cargos</SelectItem>
          {CARGOS_TSE.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
