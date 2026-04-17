import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  log: any | null;
  onClose: () => void;
}

function diffKeys(oldD: any, newD: any): string[] {
  const keys = new Set<string>([...Object.keys(oldD ?? {}), ...Object.keys(newD ?? {})]);
  return Array.from(keys).filter((k) => JSON.stringify(oldD?.[k]) !== JSON.stringify(newD?.[k]));
}

export function AuditDetailDialog({ log, onClose }: Props) {
  if (!log) return null;
  const changed = log.action === "update" ? diffKeys(log.old_data, log.new_data) : [];

  return (
    <Dialog open={!!log} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline">{log.action}</Badge>
            {log.table_name}
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              {new Date(log.created_at).toLocaleString("pt-BR")}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="text-xs space-y-3">
          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
            <div><b>Registro:</b> <span className="font-mono">{log.record_id || "—"}</span></div>
            <div><b>Usuário:</b> <span className="font-mono">{log.user_id || "sistema"}</span></div>
          </div>

          {log.action === "update" && changed.length > 0 && (
            <div>
              <p className="font-medium mb-2 text-foreground">Campos alterados ({changed.length})</p>
              <ScrollArea className="h-72 rounded border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0"><tr><th className="text-left p-2">Campo</th><th className="text-left p-2">Antes</th><th className="text-left p-2">Depois</th></tr></thead>
                  <tbody>
                    {changed.map((k) => (
                      <tr key={k} className="border-t">
                        <td className="p-2 font-mono">{k}</td>
                        <td className="p-2 text-destructive font-mono">{JSON.stringify(log.old_data?.[k])}</td>
                        <td className="p-2 text-green-600 font-mono">{JSON.stringify(log.new_data?.[k])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}

          {(log.action === "create" || log.action === "delete") && (
            <div>
              <p className="font-medium mb-2 text-foreground">{log.action === "create" ? "Dados criados" : "Dados removidos"}</p>
              <ScrollArea className="h-72 rounded border bg-muted/30 p-2">
                <pre className="text-[11px]">{JSON.stringify(log.new_data ?? log.old_data, null, 2)}</pre>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
