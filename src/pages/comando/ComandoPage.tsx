import { AppLayout } from "@/components/layout/AppLayout";
import { useIndicadoresCampanha, useBurndown, useComandoRealtime } from "@/hooks/useComando";
import { KPIGrid } from "@/components/comando/KPIGrid";
import { BurndownChart } from "@/components/comando/BurndownChart";
import { ReunioesPanel } from "@/components/comando/ReunioesPanel";
import { Loader2, Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ComandoPage() {
  const { data: indicadores, isLoading } = useIndicadoresCampanha();
  const { data: burndown = [] } = useBurndown(indicadores?.campanha_id);
  const { live, lastUpdate } = useComandoRealtime(indicadores?.campanha_id);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sala de Situação</h1>
            <p className="text-sm text-muted-foreground">
              {indicadores?.campanha_nome
                ? `Campanha ativa: ${indicadores.campanha_nome}`
                : "Nenhuma campanha ativa configurada."}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
            <Radio className={`h-3.5 w-3.5 ${live ? "text-success animate-pulse" : "text-muted-foreground"}`} />
            <span className={live ? "text-success font-medium" : "text-muted-foreground"}>
              {live ? "Ao vivo" : "Reconectando…"}
            </span>
            {lastUpdate && (
              <span className="text-muted-foreground">
                · atualizado {formatDistanceToNow(lastUpdate, { locale: ptBR, addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !indicadores ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Crie uma campanha ativa em <strong>Plano de Campanha</strong> para visualizar os indicadores.
          </div>
        ) : (
          <>
            <KPIGrid data={indicadores} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BurndownChart data={burndown} />
              <ReunioesPanel />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
