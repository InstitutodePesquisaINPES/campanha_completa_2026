import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type ResultadoBusca = {
  tipo: string;
  id: string;
  titulo: string;
  subtitulo: string | null;
  link: string;
};

const TIPO_LABEL: Record<string, string> = {
  pessoa: "Pessoas",
  demanda: "Demandas",
  agenda: "Agenda",
  municipio: "Municípios",
  campanha: "Campanhas",
  despesa: "Despesas",
  material: "Materiais",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if ((e.target as HTMLElement)?.tagName === "INPUT" && e.key === "/") return;
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data = [] } = useQuery({
    queryKey: ["busca-global", q],
    queryFn: async () => {
      if (q.trim().length < 2) return [] as ResultadoBusca[];
      const { data, error } = await supabase
        .from("v_busca_global" as any)
        .select("*")
        .ilike("titulo", `%${q}%`)
        .limit(30);
      if (error) throw error;
      return (data || []) as ResultadoBusca[];
    },
    enabled: open && q.trim().length >= 2,
  });

  const grouped = data.reduce<Record<string, ResultadoBusca[]>>((acc, r) => {
    (acc[r.tipo] ||= []).push(r);
    return acc;
  }, {});

  const handleSelect = (link: string) => {
    setOpen(false);
    setQ("");
    navigate(link);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-muted-foreground w-full max-w-xs justify-start"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="ml-auto pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar pessoas, demandas, municípios, campanhas..."
          value={q}
          onValueChange={setQ}
        />
        <CommandList>
          {q.trim().length < 2 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Digite ao menos 2 caracteres para buscar
            </div>
          ) : data.length === 0 ? (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          ) : (
            Object.entries(grouped).map(([tipo, items]) => (
              <CommandGroup key={tipo} heading={TIPO_LABEL[tipo] || tipo}>
                {items.map((r) => (
                  <CommandItem
                    key={`${r.tipo}-${r.id}`}
                    value={`${r.tipo}-${r.id}-${r.titulo}`}
                    onSelect={() => handleSelect(r.link)}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm">{r.titulo}</span>
                      {r.subtitulo && (
                        <span className="text-xs text-muted-foreground">{r.subtitulo}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
