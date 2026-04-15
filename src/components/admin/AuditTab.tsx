import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const actionColors: Record<string, string> = {
  create: "bg-green-500/10 text-green-500",
  update: "bg-blue-500/10 text-blue-500",
  delete: "bg-red-500/10 text-red-500",
  export: "bg-orange-500/10 text-orange-500",
  login: "bg-purple-500/10 text-purple-500",
  logout: "bg-gray-500/10 text-gray-500",
};

export function AuditTab() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de Auditoria (LGPD)</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum log registrado ainda.</p>
        ) : (
          <div className="overflow-auto max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action] || ""} variant="outline">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{log.table_name}</TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-[120px]">
                      {log.record_id || "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-[120px]">
                      {log.user_id ? log.user_id.slice(0, 8) + "..." : "sistema"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
