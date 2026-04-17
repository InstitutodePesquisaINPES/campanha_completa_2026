import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Eye } from "lucide-react";
import { AuditDetailDialog } from "./AuditDetailDialog";

const actionColors: Record<string, string> = {
  create: "bg-green-500/10 text-green-600",
  update: "bg-blue-500/10 text-blue-600",
  delete: "bg-red-500/10 text-red-600",
};

export function AuditTab() {
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterTable, setFilterTable] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;
  const [selected, setSelected] = useState<any | null>(null);

  const { data: logs = [], isLoading, isFetching } = useQuery({
    queryKey: ["audit-logs", filterAction, filterTable, page],
    queryFn: async () => {
      let q = supabase.from("audit_logs").select("*").order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (filterAction !== "all") q = q.eq("action", filterAction);
      if (filterTable) q = q.ilike("table_name", `%${filterTable}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de Auditoria (LGPD)</CardTitle>
        <div className="flex gap-2 flex-wrap mt-3">
          <Select value={filterAction} onValueChange={(v) => { setPage(0); setFilterAction(v); }}>
            <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas ações</SelectItem>
              <SelectItem value="create">Criação</SelectItem>
              <SelectItem value="update">Atualização</SelectItem>
              <SelectItem value="delete">Exclusão</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Filtrar por tabela…"
            value={filterTable}
            onChange={(e) => { setPage(0); setFilterTable(e.target.value); }}
            className="h-8 w-56"
          />
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            Pág. {page + 1}
            <Button size="sm" variant="outline" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>‹</Button>
            <Button size="sm" variant="outline" onClick={() => setPage(page + 1)} disabled={logs.length < PAGE_SIZE}>›</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : logs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum log encontrado.</p>
        ) : (
          <div className="overflow-auto max-h-[600px] relative">
            {isFetching && <div className="absolute top-2 right-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelected(log)}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell><Badge className={actionColors[log.action] || ""} variant="outline">{log.action}</Badge></TableCell>
                    <TableCell className="text-xs">{log.table_name}</TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-[120px]">{log.record_id || "—"}</TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-[120px]">{log.user_id ? log.user_id.slice(0, 8) + "…" : "sistema"}</TableCell>
                    <TableCell><Eye className="h-4 w-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <AuditDetailDialog log={selected} onClose={() => setSelected(null)} />
      </CardContent>
    </Card>
  );
}
