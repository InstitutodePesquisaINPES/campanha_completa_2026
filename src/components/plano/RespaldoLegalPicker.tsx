import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Search, Plus, ShieldCheck, ShieldAlert } from "lucide-react";
import { buscarRespaldo, type RespaldoLegalRef } from "@/lib/plano/respaldoLegal";

export function RespaldoLegalPicker({
  onPick,
  triggerLabel = "Buscar referência legal",
  size = "sm",
}: {
  onPick: (ref: RespaldoLegalRef) => void;
  triggerLabel?: string;
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const results = buscarRespaldo(q).slice(0, 30);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size={size} className="gap-1 h-8">
          <BookOpen className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por artigo, tema (ex: cnpj, propaganda, doação...)"
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>
        <ScrollArea className="h-[340px]">
          <div className="p-2 space-y-1.5">
            {results.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">Nenhuma referência encontrada.</p>
            )}
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onPick(r);
                  setOpen(false);
                  setQ("");
                }}
                className="w-full text-left p-2.5 rounded-md border hover:bg-accent/40 hover:border-primary/40 transition group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold">{r.norma}</span>
                  {r.permitido_antes_registro ? (
                    <Badge variant="outline" className="text-[10px] gap-0.5 bg-success/10 text-success border-success/30">
                      <ShieldCheck className="h-2.5 w-2.5" />pré-OK
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] gap-0.5 bg-warning/10 text-warning border-warning/30">
                      <ShieldAlert className="h-2.5 w-2.5" />pós-registro
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{r.ementa}</p>
                <div className="flex flex-wrap gap-1 mt-1.5 opacity-70 group-hover:opacity-100">
                  {r.tags.slice(0, 4).map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 bg-muted rounded">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-primary opacity-0 group-hover:opacity-100">
                  <Plus className="h-2.5 w-2.5" />Adicionar ao respaldo legal
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
