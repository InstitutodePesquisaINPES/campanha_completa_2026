import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import "leaflet.heat";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMunicipios, useBairros } from "@/hooks/useTerritorio";
import { useAgendaItems } from "@/hooks/useAgenda";
import { usePessoas } from "@/hooks/usePessoas";
import { useDemandas } from "@/hooks/useDemandas";
import { Camera, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { toast } from "sonner";

const classificacaoColors: Record<string, string> = {
  reduto: "#10B981",
  expansao: "#3B82F6",
  disputa: "#F59E0B",
  risco: "#EF4444",
  baixa_presenca: "#6B7280",
};

const classificacaoLabels: Record<string, string> = {
  reduto: "Reduto", expansao: "Expansão", disputa: "Disputa", risco: "Risco", baixa_presenca: "Baixa Presença",
};

const zonaColors: Record<string, string> = {
  urbano: "#8B5CF6", rural: "#22C55E", misto: "#F59E0B", desconhecido: "#94A3B8",
};

export function MapaInterativo() {
  const { data: municipios } = useMunicipios();
  const { data: bairros } = useBairros();
  const { data: agenda } = useAgendaItems();
  const { data: pessoas } = usePessoas();
  const { data: demandas } = useDemandas();

  // Layers toggles
  const [layers, setLayers] = useState({
    municipios: true,
    bairros: true,
    agenda: true,
    pessoasCluster: true,
    demandasHeat: true,
    densidade: false,
    zonaUrbana: false,
  });
  const [opacity, setOpacity] = useState(0.7);
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>("all");
  const [filtroClassif, setFiltroClassif] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerObjs = useRef<L.Layer[]>([]);

  const center = useMemo<[number, number]>(() => {
    const m = municipios?.find((x) => x.latitude != null && x.longitude != null);
    return m ? [m.latitude as number, m.longitude as number] : [-12.97, -41.5]; // Bahia
  }, [municipios]);

  const bairrosFiltrados = useMemo(() => {
    return (bairros ?? []).filter((b) => {
      if (filtroMunicipio !== "all" && b.municipio_id !== filtroMunicipio) return false;
      if (filtroClassif !== "all" && b.classificacao !== filtroClassif) return false;
      return true;
    });
  }, [bairros, filtroMunicipio, filtroClassif]);

  // Init map
  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;
    const map = L.map(mapElementRef.current, { scrollWheelZoom: true }).setView(center, 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OSM contributors',
    }).addTo(map);
    // Mini-mapa (escala simples)
    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);
    mapRef.current = map;
    return () => {
      layerObjs.current.forEach((l) => map.removeLayer(l));
      layerObjs.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layerObjs.current.forEach((l) => map.removeLayer(l));
    layerObjs.current = [];

    // 1. Municípios
    if (layers.municipios) {
      const lg = L.layerGroup();
      (municipios ?? []).filter((m) => m.latitude && m.longitude).forEach((m) => {
        L.marker([m.latitude!, m.longitude!])
          .bindPopup(`<strong>${m.nome}</strong><br/>Pop 2022: ${(m as any).populacao_2022?.toLocaleString("pt-BR") || "n/d"}<br/>Eleitorado: ${m.eleitorado_total?.toLocaleString("pt-BR") || "n/d"}`)
          .addTo(lg);
      });
      lg.addTo(map);
      layerObjs.current.push(lg);
    }

    // 2. Bairros (cor por classificação ou zona)
    if (layers.bairros) {
      const lg = L.layerGroup();
      bairrosFiltrados.filter((b) => b.latitude && b.longitude).forEach((b) => {
        const color = layers.zonaUrbana
          ? zonaColors[(b as any).zona_tipo || "desconhecido"]
          : classificacaoColors[b.classificacao || "baixa_presenca"];
        L.circleMarker([b.latitude!, b.longitude!], {
          radius: 7, fillColor: color, color, fillOpacity: opacity, weight: 2,
        })
          .bindPopup(`<strong>${b.nome}</strong><br/>Classif: ${classificacaoLabels[b.classificacao || "baixa_presenca"]}<br/>Zona: ${(b as any).zona_tipo || "n/d"}<br/>Pop est: ${(b as any).populacao_estimada?.toLocaleString("pt-BR") || "n/d"}`)
          .addTo(lg);
      });
      lg.addTo(map);
      layerObjs.current.push(lg);
    }

    // 3. Cluster pessoas
    if (layers.pessoasCluster && pessoas) {
      // @ts-ignore
      const cluster = (L as any).markerClusterGroup({ disableClusteringAtZoom: 14, chunkedLoading: true });
      pessoas.filter((p: any) => p.latitude && p.longitude).forEach((p: any) => {
        L.marker([p.latitude, p.longitude]).bindPopup(`<strong>${p.nome_completo || p.nome}</strong><br/>${p.bairro_nome || ""}`).addTo(cluster);
      });
      map.addLayer(cluster);
      layerObjs.current.push(cluster);
    }

    // 4. Heatmap demandas
    if (layers.demandasHeat && demandas) {
      const points: [number, number, number][] = (demandas as any[])
        .filter((d) => d.latitude && d.longitude)
        .map((d) => [d.latitude, d.longitude, d.prioridade === "urgente" ? 1 : d.prioridade === "alta" ? 0.7 : 0.4]);
      if (points.length > 0) {
        // @ts-ignore
        const heat = (L as any).heatLayer(points, { radius: 25, blur: 18, max: 1, minOpacity: 0.4 });
        heat.addTo(map);
        layerObjs.current.push(heat);
      }
    }

    // 5. Eventos agenda
    if (layers.agenda && agenda) {
      const lg = L.layerGroup();
      (agenda as any[]).filter((a) => a.latitude && a.longitude).forEach((a) => {
        L.circleMarker([a.latitude, a.longitude], {
          radius: 6, fillColor: "#F59E0B", color: "#F59E0B", fillOpacity: 0.85, weight: 2,
        }).bindPopup(`<strong>${a.titulo}</strong><br/>${a.tipo} — ${a.status}<br/>${a.local || ""}`).addTo(lg);
      });
      lg.addTo(map);
      layerObjs.current.push(lg);
    }

    // 6. Choropleth densidade eleitoral (município) — círculos proporcionais
    if (layers.densidade) {
      const lg = L.layerGroup();
      (municipios ?? []).filter((m: any) => m.latitude && m.longitude && m.eleitorado_total).forEach((m: any) => {
        const radius = Math.sqrt(m.eleitorado_total / 100);
        L.circle([m.latitude, m.longitude], {
          radius: radius * 100,
          fillColor: m.eleitorado_total > 50000 ? "#7C3AED" : m.eleitorado_total > 20000 ? "#3B82F6" : "#94A3B8",
          color: "#1E293B",
          weight: 1,
          fillOpacity: opacity * 0.6,
        }).bindPopup(`<strong>${m.nome}</strong><br/>Eleitorado: ${m.eleitorado_total.toLocaleString("pt-BR")}`).addTo(lg);
      });
      lg.addTo(map);
      layerObjs.current.push(lg);
    }
  }, [municipios, bairrosFiltrados, agenda, pessoas, demandas, layers, opacity]);

  const exportPng = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(mapElementRef.current!, { useCORS: true, scale: 2, logging: false });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `mapa-${Date.now()}.png`;
      a.click();
      toast.success("Mapa exportado");
    } catch (e: any) {
      toast.error(`Falha: ${e.message}`);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="h-6 w-6 text-primary" /> Mapa Interativo</h1>
        <Button size="sm" variant="outline" onClick={exportPng}><Camera className="h-4 w-4 mr-1" /> Exportar PNG</Button>
      </div>

      <div className="flex gap-4">
        {/* Painel lateral colapsável */}
        <Card className={`shrink-0 transition-all overflow-hidden ${sidebarOpen ? "w-72" : "w-12"}`}>
          <CardContent className="p-3 space-y-4">
            <Button variant="ghost" size="sm" className="w-full justify-between" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen && <span className="text-xs font-semibold">Camadas & Filtros</span>}
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            {sidebarOpen && (
              <>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Camadas</p>
                  {Object.entries(layers).map(([k, v]) => (
                    <label key={k} className="flex items-center gap-2 text-xs">
                      <Checkbox checked={v} onCheckedChange={(c) => setLayers({ ...layers, [k]: Boolean(c) })} />
                      {k === "pessoasCluster" ? "Cluster pessoas" :
                       k === "demandasHeat" ? "Heatmap demandas" :
                       k === "densidade" ? "Densidade eleitoral" :
                       k === "zonaUrbana" ? "Cor por zona urbana/rural" :
                       k.charAt(0).toUpperCase() + k.slice(1)}
                    </label>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Opacidade ({Math.round(opacity * 100)}%)</p>
                  <Slider value={[opacity * 100]} onValueChange={(v) => setOpacity(v[0] / 100)} max={100} step={5} />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Filtros</p>
                  <Select value={filtroMunicipio} onValueChange={setFiltroMunicipio}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Município" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos municípios</SelectItem>
                      {(municipios ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filtroClassif} onValueChange={setFiltroClassif}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Classificação" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Object.entries(classificacaoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 pt-2 border-t border-border">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Legenda</p>
                  {Object.entries(layers.zonaUrbana ? zonaColors : classificacaoColors).map(([k, c]) => (
                    <div key={k} className="flex items-center gap-2 text-[11px]">
                      <span className="h-3 w-3 rounded-full" style={{ background: c }} />
                      <span>{layers.zonaUrbana ? k : classificacaoLabels[k]}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                  Bairros: {bairrosFiltrados.length} · Municípios: {municipios?.length || 0}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-0">
            <div style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
              <div ref={mapElementRef} className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
