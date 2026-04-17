import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Play, RefreshCw, X, Activity, Loader2 } from "lucide-react";
import { useEnqueueTSE, useTSEJobs, useTSEStats, useRunWorker, useCancelTSEJob, useTSEJobLogs, type TseJobTipo, type TseImportJob } from "@/hooks/useTSEImport";
import { toast } from "sonner";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const ANOS = [2024, 2022, 2020, 2018, 2016];
const TIPOS: { value: TseJobTipo; label: string }[] = [
  { value: "eleitorado", label: "Eleitorado" },
  { value: "candidatos", label: "Candidatos" },
  { value: "resultados", label: "Resultados" },
  { value: "locais", label: "Locais de votação" },
  { value: "prestacao_contas", label: "Prestação de contas" },
];

const statusColor: Record<string, string> = {
  queued: "bg-muted text-muted-foreground",
  running: "bg-primary text-primary-foreground",
  done: "bg-green-600 text-white",
  failed: "bg-destructive text-destructive-foreground",
  cancelled: "bg-secondary text-secondary-foreground",
};

export function TSEImportTab() {
  const [uf, setUf] = useState<string>("");
  const [anos, setAnos] = useState<number[]>([2024]);
  const [tipos, setTipos] = useState<TseJobTipo[]>(["eleitorado", "candidatos", "resultados"]);
  const [logJobId, setLogJobId] = useState<string | undefined>();

  const { data: stats } = useTSEStats();
  const { data: jobs = [], isLoading } = useTSEJobs();
  const { data: logs = [] } = useTSEJobLogs(logJobId);
  const enqueue = useEnqueueTSE();
  const runWorker = useRunWorker();
  const cancel = useCancelTSEJob();

  const toggleAno = (a: number) => setAnos((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);
  const toggleTipo = (t: TseJobTipo) => setTipos((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);

  const handleEnqueue = async () => {
    if (!uf || !anos.length || !tipos.length) {
      toast.error("Selecione UF, ao menos 1 ano e 1 tipo");
      return;
    }
    try {
      const r = await enqueue.mutateAsync({ uf, anos, tipos });
      toast.success(`${r.enqueued} jobs criados`);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enfileirar");
    }
  };

  const handleRunWorker = async () => {
    try {
      const r = await runWorker.mutateAsync();
      toast.success(r.picked ? `${r.picked} job(s) iniciados` : "Nenhum job na fila");
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    }
  };

  const queued = jobs.filter((j) => j.status === "queued").length;
  const running = jobs.filter((j) => j.status === "running").length;
  const done = jobs.filter((j) => j.status === "done").length;
  const failed = jobs.filter((j) => j.status === "failed").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Eleitorado" value={stats?.eleitorado ?? 0} />
        <StatCard label="Candidatos" value={stats?.candidatos ?? 0} />
        <StatCard label="Resultados" value={stats?.resultados ?? 0} />
        <StatCard label="Locais" value={stats?.locais ?? 0} />
        <StatCard label="Prestação contas" value={stats?.prestacao_contas ?? 0} />
      </div>

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Importar dados eleitorais (TSE)</CardTitle>
          <CardDescription>
            Dispara jobs assíncronos. O worker processa em background. Fontes: TSE/CEPESP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="mb-2 block">UF</Label>
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Anos</Label>
              <div className="flex flex-wrap gap-2">
                {ANOS.map((a) => (
                  <label key={a} className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card cursor-pointer hover:bg-accent">
                    <Checkbox checked={anos.includes(a)} onCheckedChange={() => toggleAno(a)} />
                    <span className="text-sm">{a}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Tipos</Label>
              <div className="flex flex-wrap gap-2">
                {TIPOS.map((t) => (
                  <label key={t.value} className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card cursor-pointer hover:bg-accent">
                    <Checkbox checked={tipos.includes(t.value)} onCheckedChange={() => toggleTipo(t.value)} />
                    <span className="text-sm">{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button onClick={handleEnqueue} disabled={enqueue.isPending}>
              {enqueue.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Enfileirar importação
            </Button>
            <Button variant="secondary" onClick={handleRunWorker} disabled={runWorker.isPending}>
              {runWorker.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Executar worker agora
            </Button>
            <div className="flex gap-2 ml-auto text-xs">
              <Badge variant="outline">Fila: {queued}</Badge>
              <Badge className="bg-primary text-primary-foreground">Rodando: {running}</Badge>
              <Badge className="bg-green-600 text-white">OK: {done}</Badge>
              <Badge variant="destructive">Falhas: {failed}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Jobs (atualiza a cada 3s)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
          ) : !jobs.length ? (
            <p className="text-sm text-muted-foreground">Nenhum job criado ainda.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>UF/Ano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[200px]">Progresso</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((j: TseImportJob) => (
                    <TableRow key={j.id}>
                      <TableCell className="font-medium">{j.tipo}</TableCell>
                      <TableCell>{j.uf}/{j.ano}</TableCell>
                      <TableCell><Badge className={statusColor[j.status]}>{j.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={j.progress_pct} className="h-2" />
                          <span className="text-xs text-muted-foreground w-10 text-right">{j.progress_pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {(j.registros_processados ?? 0).toLocaleString()} / {(j.total_registros ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(j.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => setLogJobId(j.id)}>Logs</Button>
                        {(j.status === "queued" || j.status === "running") && (
                          <Button size="sm" variant="ghost" onClick={() => cancel.mutate(j.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!logJobId} onOpenChange={(o) => !o && setLogJobId(undefined)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Logs do job</DialogTitle></DialogHeader>
          <ScrollArea className="h-[400px] rounded-md border bg-muted/30 p-3 font-mono text-xs">
            {!logs.length ? <p className="text-muted-foreground">Sem logs ainda.</p> : logs.map((l: any) => (
              <div key={l.id} className="py-0.5">
                <span className="text-muted-foreground">[{new Date(l.created_at).toLocaleTimeString("pt-BR")}]</span>{" "}
                <span className={l.level === "error" ? "text-destructive" : ""}>{l.message}</span>
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value.toLocaleString("pt-BR")}</div>
      </CardContent>
    </Card>
  );
}
