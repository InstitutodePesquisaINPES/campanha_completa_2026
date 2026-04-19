import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Point {
  data_prevista: string;
  total_acumulado: number;
  concluidas_acumulado: number;
}

export function BurndownChart({ data }: { data: Point[] }) {
  const chart = data.map((d) => ({
    data: new Date(d.data_prevista).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    Previsto: Number(d.total_acumulado),
    Concluído: Number(d.concluidas_acumulado),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Curva de execução de tarefas</CardTitle>
      </CardHeader>
      <CardContent>
        {chart.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados de tarefas para exibir.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="Previsto" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" fillOpacity={0.4} />
              <Area type="monotone" dataKey="Concluído" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
