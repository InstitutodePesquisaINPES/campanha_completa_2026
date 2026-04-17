import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export function SystemHealthCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-system-health");
      if (error) throw error;
      return data as Record<string, number>;
    },
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const alerts: { label: string; value: number; bad: boolean }[] = [
    { label: "Demandas atrasadas", value: data?.demandasAtrasadas ?? 0, bad: (data?.demandasAtrasadas ?? 0) > 0 },
    { label: "Pessoas sem contato", value: data?.pessoasSemContato ?? 0, bad: (data?.pessoasSemContato ?? 0) > 10 },
    { label: "Demandas abertas", value: data?.demandasAbertas ?? 0, bad: (data?.demandasAbertas ?? 0) > 50 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" /> Saúde do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((a) => (
          <div key={a.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {a.bad ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {a.label}
            </span>
            <span className={a.bad ? "font-bold text-destructive" : "text-muted-foreground"}>{a.value}</span>
          </div>
        ))}
        <div className="pt-2 mt-2 border-t text-xs text-muted-foreground">
          {data?.usuariosTotal ?? 0} usuários · {data?.campanhasAtivas ?? 0} campanhas ativas · {data?.auditHoje ?? 0} ações hoje
        </div>
      </CardContent>
    </Card>
  );
}
