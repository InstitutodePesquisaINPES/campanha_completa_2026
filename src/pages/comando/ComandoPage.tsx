import { AppLayout } from "@/components/layout/AppLayout";
import { useIndicadoresCampanha, useBurndown } from "@/hooks/useComando";
import { KPIGrid } from "@/components/comando/KPIGrid";
import { BurndownChart } from "@/components/comando/BurndownChart";
import { ReunioesPanel } from "@/components/comando/ReunioesPanel";
import { Loader2 } from "lucide-react";

export default function ComandoPage() {
  const { data: indicadores, isLoading } = useIndicadoresCampanha();
  const { data: burndown = [] } = useBurndown(indicadores?.campanha_id);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sala de Situação</h1>
          <p className="text-sm text-muted-foreground">
            {indicadores?.campanha_nome
              ? `Campanha ativa: ${indicadores.campanha_nome}`
              : "Nenhuma campanha ativa configurada."}
          </p>
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
