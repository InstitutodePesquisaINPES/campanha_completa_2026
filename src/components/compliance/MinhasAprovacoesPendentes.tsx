import { useMinhasAprovacoesPendentes, PAPEL_LABEL } from "@/hooks/useContratoAprovacoes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox } from "lucide-react";
import { format } from "date-fns";

export function MinhasAprovacoesPendentes({ onSelect }: { onSelect?: (contratoId: string) => void }) {
  const { data: pend = [], isLoading } = useMinhasAprovacoesPendentes();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Inbox className="h-4 w-4 text-primary" />
          Aprovações pendentes
          <Badge variant="secondary" className="ml-auto">{pend.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : pend.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma aprovação pendente.</p>
        ) : (
          pend.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect?.(p.contrato_id)}
              className="w-full text-left rounded-md border border-border p-2 hover:bg-accent transition-colors space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium truncate">{p.objeto}</span>
                <Badge variant="outline" className="text-[10px]">{PAPEL_LABEL[p.papel]}</Badge>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{p.numero || "s/ nº"} · etapa {p.ordem}</span>
                <span className="font-mono">{Number(p.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {format(new Date(p.data_inicio), "dd/MM/yy")} → {format(new Date(p.data_fim), "dd/MM/yy")}
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
