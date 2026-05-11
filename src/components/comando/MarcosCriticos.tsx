import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlarmClock, Flag } from "lucide-react";

export function MarcosCriticos({ campanhaId }: { campanhaId: string }) {
  const { data: marcos = [] } = useQuery({
    queryKey: ["marcos-criticos", campanhaId],
    enabled: !!campanhaId,
    queryFn: async () => {
      try {
        const data = await api.get<any[]>(`/campanhas/${campanhaId}/marcos-criticos`);
        return data || [];
      } catch {
        return [];
      }
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlarmClock className="h-4 w-4 text-warning" />
          Marcos críticos · próximas tarefas urgentes/altas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {marcos.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Sem marcos críticos próximos.</p>
        ) : (
          marcos.map((m: any) => {
            const data = new Date(m.data_prevista);
            const dias = Math.max(0, Math.ceil((data.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            return (
              <div key={m.id} className="flex items-start justify-between gap-3 p-2 rounded-md border border-border hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Flag className={`h-3 w-3 shrink-0 ${m.prioridade === "urgente" ? "text-destructive" : "text-warning"}`} />
                    <span className="text-sm font-medium truncate">{m.titulo}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <Badge variant="outline" className="text-[9px] h-4 capitalize">{m.area}</Badge>
                    <span>{data.toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <Badge variant={dias <= 7 ? "destructive" : "secondary"} className="shrink-0">
                  {dias === 0 ? "hoje" : `D-${dias}`}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
