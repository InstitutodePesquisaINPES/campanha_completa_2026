import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Archive,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Download,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useTSECsvArquivos,
  useRunTSECsvWorker,
  usePausarTSECsvArquivo,
  useRetomarTSECsvArquivo,
  useReprocessarTSECsvArquivo,
  useExcluirTSECsvArquivo,
  useDownloadTSECsv,
  type TseCsvArquivo,
} from "@/hooks/useTSECsvArquivos";

const STATUS_CFG: Record<
  string,
  { label: string; className: string }
> = {
  aguardando: { label: "Aguardando", className: "bg-muted text-muted-foreground" },
  processando: { label: "Processando", className: "bg-primary text-primary-foreground" },
  pausado: { label: "Pausado", className: "bg-amber-500 text-white" },
  concluido: { label: "Concluído", className: "bg-green-600 text-white" },
  erro: { label: "Erro", className: "bg-destructive text-destructive-foreground" },
};

function fmtBytes(b: number | null | undefined): string {
  if (!b) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = b;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${u[i]}`;
}

export function TSECsvArquivosList() {
  const { data: arquivos = [], isLoading } = useTSECsvArquivos();
  const runWorker = useRunTSECsvWorker();
  const pausar = usePausarTSECsvArquivo();
  const retomar = useRetomarTSECsvArquivo();
  const reprocessar = useReprocessarTSECsvArquivo();
  const excluir = useExcluirTSECsvArquivo();
  const baixar = useDownloadTSECsv();

  const [excluirAlvo, setExcluirAlvo] = useState<TseCsvArquivo | null>(null);
  const [reprocAlvo, setReprocAlvo] = useState<TseCsvArquivo | null>(null);
  const autoRunningRef = useRef(false);

  const counts = {
    aguardando: arquivos.filter((a) => a.status === "aguardando").length,
    processando: arquivos.filter((a) => a.status === "processando").length,
    pausado: arquivos.filter((a) => a.status === "pausado").length,
    concluido: arquivos.filter((a) => a.status === "concluido").length,
    erro: arquivos.filter((a) => a.status === "erro").length,
  };

  useEffect(() => {
    const hasFilaAtiva = counts.aguardando > 0 || counts.processando > 0;
    if (!hasFilaAtiva) return;

    const tick = async () => {
      if (autoRunningRef.current) return;
      autoRunningRef.current = true;
      try {
        await runWorker.mutateAsync();
      } catch (_) {
        // O status/erro real aparece na linha do arquivo; evita spam de toast no bombeamento automático.
      } finally {
        autoRunningRef.current = false;
      }
    };

    tick();
    const id = window.setInterval(tick, 2000);
    return () => window.clearInterval(id);
  }, [counts.aguardando, counts.processando, runWorker]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" /> Arquivos CSV arquivados
            </CardTitle>
            <CardDescription>
              CSVs grandes ficam guardados no servidor e são processados em background, com
              retomada automática mesmo se você fechar a aba.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Fila: {counts.aguardando}</Badge>
            <Badge className="bg-primary text-primary-foreground">
              Rodando: {counts.processando}
            </Badge>
            {counts.pausado > 0 && (
              <Badge className="bg-amber-500 text-white">Pausados: {counts.pausado}</Badge>
            )}
            <Badge className="bg-green-600 text-white">OK: {counts.concluido}</Badge>
            {counts.erro > 0 && <Badge variant="destructive">Erros: {counts.erro}</Badge>}
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const r: any = await runWorker.mutateAsync();
                  toast.success(
                    r?.arquivo
                      ? "Worker iniciou um arquivo"
                      : r?.msg ?? "Worker executado",
                  );
                } catch (e: any) {
                  toast.error(e.message ?? "Falha ao executar worker");
                }
              }}
              disabled={runWorker.isPending}
            >
              {runWorker.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Processar agora
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : !arquivos.length ? (
          <p className="text-sm text-muted-foreground">
            Nenhum CSV arquivado ainda. Faça um upload acima escolhendo a opção “Arquivar e
            processar em background”.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>UF/Ano</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[220px]">Progresso</TableHead>
                  <TableHead>Linhas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arquivos.map((a) => {
                  const cfg = STATUS_CFG[a.status] ?? STATUS_CFG.aguardando;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="max-w-[260px]">
                        <div
                          className="text-sm font-medium truncate"
                          title={a.nome_original}
                        >
                          {a.nome_original}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(a.created_at).toLocaleString("pt-BR")}
                        </div>
                        {a.error_msg && (
                          <div className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            <span className="truncate" title={a.error_msg}>
                              {a.error_msg}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{a.tipo}</TableCell>
                      <TableCell className="text-xs">
                        {a.uf}/{a.ano}
                      </TableCell>
                      <TableCell className="text-xs">{fmtBytes(a.tamanho_bytes)}</TableCell>
                      <TableCell>
                        <Badge className={cfg.className}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={a.progress_pct} className="h-2" />
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {a.progress_pct}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {(a.linhas_processadas ?? 0).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        {(a.status === "aguardando" || a.status === "processando") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Pausar"
                            onClick={() => pausar.mutate(a.id)}
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {(a.status === "pausado" || a.status === "erro") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Retomar"
                            onClick={() => retomar.mutate(a.id)}
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Reprocessar do zero"
                          onClick={() => setReprocAlvo(a)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Baixar CSV original"
                          onClick={() => baixar.mutate(a)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Excluir arquivo"
                          onClick={() => setExcluirAlvo(a)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!excluirAlvo} onOpenChange={(o) => !o && setExcluirAlvo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir arquivo arquivado?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso remove o CSV original do servidor e a entrada da fila. Os dados já
              importados nas tabelas TSE permanecem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!excluirAlvo) return;
                try {
                  await excluir.mutateAsync(excluirAlvo);
                  toast.success("Arquivo excluído");
                } catch (e: any) {
                  toast.error(e.message ?? "Falha ao excluir");
                }
                setExcluirAlvo(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!reprocAlvo} onOpenChange={(o) => !o && setReprocAlvo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reprocessar do zero?</AlertDialogTitle>
            <AlertDialogDescription>
              O cursor volta para o início do arquivo. Como a ingestão usa upsert idempotente,
              registros já presentes são apenas reverificados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!reprocAlvo) return;
                try {
                  await reprocessar.mutateAsync(reprocAlvo.id);
                  toast.success("Arquivo reenfileirado");
                } catch (e: any) {
                  toast.error(e.message ?? "Falha ao reprocessar");
                }
                setReprocAlvo(null);
              }}
            >
              Reprocessar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
