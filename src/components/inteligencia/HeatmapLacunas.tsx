import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";
import { useLacunasTerritoriais } from "@/hooks/useInteligenciaTerritorial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function HeatmapLacunas() {
  const { data = [], isLoading } = useLacunasTerritoriais();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current).setView([-12.97, -38.5], 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(mapRef.current);
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !data.length) return;
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
    }
    const points = data
      .filter((d) => d.latitude && d.longitude)
      .map((d) => [d.latitude!, d.longitude!, Math.min(d.score_prioridade / 100, 1)]) as [number, number, number][];

    if (points.length === 0) return;

    heatLayerRef.current = (L as any).heatLayer(points, {
      radius: 30,
      blur: 25,
      maxZoom: 12,
      gradient: { 0.2: "#22c55e", 0.4: "#eab308", 0.7: "#f97316", 1: "#ef4444" },
    }).addTo(mapRef.current);

    const bounds = L.latLngBounds(points.map((p) => [p[0], p[1]]));
    mapRef.current.fitBounds(bounds, { padding: [40, 40] });
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mapa de Calor — Prioridade Territorial</CardTitle>
        <p className="text-xs text-muted-foreground">
          Verde: cobertura adequada · Amarelo/Laranja: atenção · Vermelho: lacuna crítica (alta demanda + baixa presença)
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div ref={containerRef} className="h-[500px] w-full rounded-lg overflow-hidden border" />
        )}
      </CardContent>
    </Card>
  );
}
