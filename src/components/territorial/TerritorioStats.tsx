import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Building2, Home, Vote, Users, Map } from "lucide-react";

export function TerritorioStats() {
  const { data } = useQuery({
    queryKey: ["territorio-stats"],
    queryFn: async () => {
      const stats = await api.get<any>("/territorio/stats");
      return {
        estados: stats?.estados ?? 0,
        municipios: stats?.municipios ?? 0,
        bairros: stats?.bairros ?? 0,
        zonas: stats?.zonas ?? 0,
        secoes: stats?.secoes ?? 0,
        areas: stats?.areas ?? 0,
      };
    },
  });

  const items = [
    { label: "Estados", value: data?.estados ?? 0, icon: Map },
    { label: "Municípios", value: data?.municipios ?? 0, icon: Building2 },
    { label: "Bairros", value: data?.bairros ?? 0, icon: Home },
    { label: "Zonas", value: data?.zonas ?? 0, icon: Vote },
    { label: "Seções", value: data?.secoes ?? 0, icon: MapPin },
    { label: "Áreas", value: data?.areas ?? 0, icon: Users },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card key={it.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Icon className="h-3.5 w-3.5" />
                {it.label}
              </div>
              <div className="text-2xl font-bold">{it.value.toLocaleString("pt-BR")}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
