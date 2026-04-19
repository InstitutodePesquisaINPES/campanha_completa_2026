import { useImportJobs, useTriggerImport } from "@/hooks/useDemografia";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, MapPin, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusVariant: Record<string, any> = {
  sucesso: "default", erro: "destructive", parcial: "secondary", rodando: "outline", pendente: "outline",
};
const statusIcon: Record<string, any> = {
  sucesso: CheckCircle2, erro: XCircle, parcial: AlertCircle, rodando: Loader2, pendente: Clock,
};

export function IBGEImportPanel() {
  const { data: jobs = [] } = useImportJobs();
  const trigger = useTriggerImport();

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" /> IBGE — Censo 2022
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Importa população, área, densidade e perfil etário/sexo dos 417 municípios da Bahia via API SIDRA.
            </p>
            <Button
              size="sm"
              onClick={() => trigger.mutate({ fonte: "ibge", uf: "BA" })}
              disabled={trigger.isPending}
              className="w-full"
            >
              {trigger.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Database className="h-4 w-4 mr-1" />}
              Importar dados IBGE BA
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> OpenStreetMap — Bairros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Importa bairros oficiais via Overpass API e classifica como urbano/rural pelo tag <code>place=</code>.
              Rate limit: 1 req/2s.
            </p>
            <Button
              size="sm"
              onClick={() => trigger.mutate({ fonte: "osm" })}
              disabled={trigger.isPending}
              className="w-full"
              variant="outline"
            >
              {trigger.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MapPin className="h-4 w-4 mr-1" />}
              Importar bairros OSM
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Histórico de importações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-auto">
          {jobs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma importação ainda.</p>
          ) : jobs.map((j: any) => {
            const Icon = statusIcon[j.status] || Clock;
            return (
              <div key={j.id} className="flex items-center gap-3 rounded-md border border-border p-2">
                <Icon className={`h-4 w-4 shrink-0 ${j.status === "rodando" ? "animate-spin text-primary" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{j.fonte} · {j.tipo}</span>
                    <Badge variant={statusVariant[j.status] || "outline"} className="text-[10px]">{j.status}</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {format(new Date(j.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    {j.total_processados > 0 && ` · ${j.total_processados} processados`}
                    {j.total_inseridos > 0 && ` · ${j.total_inseridos} novos`}
                    {j.total_atualizados > 0 && ` · ${j.total_atualizados} atualizados`}
                  </div>
                  {j.erro && <div className="text-[10px] text-destructive truncate" title={j.erro}>{j.erro}</div>}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
