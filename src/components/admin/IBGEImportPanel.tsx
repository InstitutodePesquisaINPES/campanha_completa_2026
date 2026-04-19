import { useState } from "react";
import { useImportJobs, useTriggerImport } from "@/hooks/useDemografia";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Database, MapPin, Loader2, CheckCircle2, XCircle, Clock, AlertCircle, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const statusVariant: Record<string, any> = {
  sucesso: "default", erro: "destructive", parcial: "secondary", rodando: "outline", pendente: "outline",
};
const statusIcon: Record<string, any> = {
  sucesso: CheckCircle2, erro: XCircle, parcial: AlertCircle, rodando: Loader2, pendente: Clock,
};

function useMunicipiosSearch(q: string) {
  return useQuery({
    queryKey: ["mun-search", q],
    enabled: q.trim().length >= 2,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("municipios")
        .select("id, nome, geocodigo_ibge")
        .ilike("nome", `%${q.trim()}%`)
        .order("nome")
        .limit(8);
      return (data || []) as Array<{ id: string; nome: string; geocodigo_ibge: string | null }>;
    },
  });
}

export function IBGEImportPanel() {
  const { data: jobs = [] } = useImportJobs();
  const trigger = useTriggerImport();
  const [q, setQ] = useState("");
  const { data: matches = [] } = useMunicipiosSearch(q);
  const [selected, setSelected] = useState<{ id: string; nome: string } | null>(null);

  return (
    <div className="space-y-4">
      {/* IMPORT POR MUNICÍPIO (rápido, síncrono) */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Importar 1 município (rápido — recomendado)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Buscar município (ex: Vitória da Conquista)"
              value={selected ? selected.nome : q}
              onChange={(e) => { setQ(e.target.value); setSelected(null); }}
            />
            {!selected && matches.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-56 overflow-auto">
                {matches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelected({ id: m.id, nome: m.nome }); setQ(""); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                  >
                    {m.nome} {m.geocodigo_ibge ? <span className="text-muted-foreground text-xs">· {m.geocodigo_ibge}</span> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              disabled={!selected || trigger.isPending}
              onClick={() => selected && trigger.mutate({ fonte: "ibge", municipio_id: selected.id })}
            >
              {trigger.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Database className="h-4 w-4 mr-1" />}
              IBGE deste município
            </Button>
            <Button
              size="sm" variant="outline"
              disabled={!selected || trigger.isPending}
              onClick={() => selected && trigger.mutate({ fonte: "osm", municipio_id: selected.id })}
            >
              {trigger.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MapPin className="h-4 w-4 mr-1" />}
              Bairros OSM
            </Button>
          </div>
          {selected && (
            <p className="text-xs text-muted-foreground">
              Selecionado: <span className="font-medium text-foreground">{selected.nome}</span> · execução síncrona em ~5-15s.
            </p>
          )}
        </CardContent>
      </Card>

      {/* IMPORT BULK BACKGROUND */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" /> IBGE — Censo 2022 (todos)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Roda em background. Processa os 417 municípios com paralelismo controlado (3 simultâneos).
              Tempo estimado: 8-15 min. Acompanhe pelo histórico.
            </p>
            <Button
              size="sm"
              onClick={() => trigger.mutate({ fonte: "ibge", uf: "BA" })}
              disabled={trigger.isPending}
              className="w-full"
            >
              {trigger.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Database className="h-4 w-4 mr-1" />}
              Importar BA inteira (background)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> OSM — Bairros (todos)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Background. Rate limit 1.5s/município (Overpass). Tempo: ~12-20 min. Classifica urbano/rural.
            </p>
            <Button
              size="sm"
              onClick={() => trigger.mutate({ fonte: "osm" })}
              disabled={trigger.isPending}
              className="w-full"
              variant="outline"
            >
              {trigger.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MapPin className="h-4 w-4 mr-1" />}
              Bairros BA inteira (background)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* HISTÓRICO */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Histórico de importações (auto-refresh 5s)</CardTitle>
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
