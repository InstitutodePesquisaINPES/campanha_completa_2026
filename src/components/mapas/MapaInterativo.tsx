import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import "leaflet.heat";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMunicipios, useBairros, useUpdateBairro } from "@/hooks/useTerritorio";
import { useAgendaItems } from "@/hooks/useAgenda";
import { usePessoas } from "@/hooks/usePessoas";
import { useDemandas } from "@/hooks/useDemandas";
import {
  useMapaCenarios, useSaveCenario, useDeleteCenario,
  useMapaSetores, useSaveSetor, useUpdateSetor, useDeleteSetor,
  calcularAreaKm2, calcularPerimetroKm,
} from "@/hooks/useMapa";
import {
  Camera, ChevronLeft, ChevronRight, Layers, Save, Trash2, Map as MapIcon,
  Pencil, Download, Search, Ruler, Bookmark, FileJson, Plus,
} from "lucide-react";
import { toast } from "sonner";

const classificacaoColors: Record<string, string> = {
  reduto: "#10B981", expansao: "#3B82F6", disputa: "#F59E0B", risco: "#EF4444", baixa_presenca: "#6B7280",
};
const classificacaoLabels: Record<string, string> = {
  reduto: "Reduto", expansao: "Expansão", disputa: "Disputa", risco: "Risco", baixa_presenca: "Baixa Presença",
};
const zonaColors: Record<string, string> = {
  urbano: "#8B5CF6", rural: "#22C55E", misto: "#F59E0B", desconhecido: "#94A3B8",
};

const BASEMAPS = {
  osm: { name: "Padrão (OSM)", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr: "© OSM contributors" },
  satellite: { name: "Satélite", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "© Esri" },
  topo: { name: "Terreno", url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attr: "© OpenTopoMap (CC-BY-SA)" },
  dark: { name: "Escuro", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", attr: "© CARTO" },
  light: { name: "Claro", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", attr: "© CARTO" },
};

type BasemapKey = keyof typeof BASEMAPS;

interface LayersState {
  municipios: boolean;
  bairros: boolean;
  agenda: boolean;
  pessoasCluster: boolean;
  demandasHeat: boolean;
  densidade: boolean;
  zonaUrbana: boolean;
  setores: boolean;
}

export function MapaInterativo() {
  const { data: municipios } = useMunicipios();
  const { data: bairros } = useBairros();
  const { data: agenda } = useAgendaItems();
  const { data: pessoas } = usePessoas();
  const { data: demandas } = useDemandas();
  const { data: cenarios } = useMapaCenarios();
  const { data: setores } = useMapaSetores();
  const updateBairro = useUpdateBairro();
  const saveCenario = useSaveCenario();
  const deleteCenario = useDeleteCenario();
  const saveSetor = useSaveSetor();
  const updateSetor = useUpdateSetor();
  const deleteSetor = useDeleteSetor();

  const [layers, setLayers] = useState<LayersState>({
    municipios: true, bairros: true, agenda: true, pessoasCluster: true,
    demandasHeat: true, densidade: false, zonaUrbana: false, setores: true,
  });
  const [opacity, setOpacity] = useState(0.7);
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>("all");
  const [filtroClassif, setFiltroClassif] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [basemap, setBasemap] = useState<BasemapKey>("light");
  const [editMode, setEditMode] = useState(false);
  const [editingBairro, setEditingBairro] = useState<any>(null);
  const [pendingSetor, setPendingSetor] = useState<{ coords: [number, number][]; area: number; perimetro: number } | null>(null);
  const [setorForm, setSetorForm] = useState({ nome: "", tipo: "setor", cor: "#3B82F6", observacoes: "" });
  const [cenarioNome, setCenarioNome] = useState("");
  const [cenarioOpen, setCenarioOpen] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);
  const measureLineRef = useRef<L.Polyline | null>(null);
  const measurePointsRef = useRef<L.LatLng[]>([]);

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layerObjs = useRef<L.Layer[]>([]);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const searchControlRef = useRef<any>(null);

  const center = useMemo<[number, number]>(() => {
    const m = municipios?.find((x) => x.latitude != null && x.longitude != null);
    return m ? [m.latitude as number, m.longitude as number] : [-12.97, -41.5];
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
    const map = L.map(mapElementRef.current, { scrollWheelZoom: true, zoomControl: true }).setView(center, 7);
    tileLayerRef.current = L.tileLayer(BASEMAPS[basemap].url, { attribution: BASEMAPS[basemap].attr, maxZoom: 19 }).addTo(map);
    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

    // Drawing layer
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Search control
    const provider = new OpenStreetMapProvider({ params: { countrycodes: "br", "accept-language": "pt-BR" } });
    // @ts-ignore
    const search = new GeoSearchControl({
      provider, style: "bar", showMarker: true, showPopup: true, autoClose: true,
      retainZoomLevel: false, animateZoom: true, searchLabel: "Buscar endereço...", keepResult: true,
    });
    map.addControl(search);
    searchControlRef.current = search;

    // Drawing events
    map.on(L.Draw.Event.CREATED as any, (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      if (e.layerType === "polygon" || e.layerType === "rectangle") {
        const latlngs = (layer.getLatLngs()[0] as L.LatLng[]).map((p) => [p.lat, p.lng] as [number, number]);
        const area = calcularAreaKm2(latlngs);
        const perimetro = calcularPerimetroKm(latlngs);
        setPendingSetor({ coords: latlngs, area, perimetro });
      }
    });

    mapRef.current = map;
    return () => {
      layerObjs.current.forEach((l) => map.removeLayer(l));
      layerObjs.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch basemap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(BASEMAPS[basemap].url, { attribution: BASEMAPS[basemap].attr, maxZoom: 19 }).addTo(map);
    tileLayerRef.current.bringToBack();
  }, [basemap]);

  // Edit mode toggle (draw control)
  const drawControlRef = useRef<any>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !drawnItemsRef.current) return;
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
      drawControlRef.current = null;
    }
    if (editMode) {
      // @ts-ignore
      drawControlRef.current = new L.Control.Draw({
        position: "topleft",
        edit: { featureGroup: drawnItemsRef.current, remove: true },
        draw: { polygon: { allowIntersection: false, showArea: true }, rectangle: {}, polyline: {}, marker: false, circle: false, circlemarker: false },
      });
      map.addControl(drawControlRef.current);
    }
  }, [editMode]);

  // Measure mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onClick = (e: L.LeafletMouseEvent) => {
      if (!measureMode) return;
      measurePointsRef.current.push(e.latlng);
      if (measureLineRef.current) map.removeLayer(measureLineRef.current);
      measureLineRef.current = L.polyline(measurePointsRef.current, { color: "#EF4444", weight: 3, dashArray: "6,8" }).addTo(map);
      if (measurePointsRef.current.length >= 2) {
        const coords = measurePointsRef.current.map((p) => [p.lat, p.lng] as [number, number]);
        const dist = calcularPerimetroKm(coords) - calcularPerimetroKm([coords[coords.length - 1], coords[0]]) / 2;
        // soma simples par a par
        let total = 0;
        for (let i = 1; i < coords.length; i++) {
          total += calcularPerimetroKm([coords[i - 1], coords[i]]) / 2;
        }
        measureLineRef.current.bindTooltip(`${total.toFixed(2)} km`, { permanent: true, direction: "right" }).openTooltip();
      }
    };
    map.on("click", onClick);
    return () => { map.off("click", onClick); };
  }, [measureMode]);

  const clearMeasure = () => {
    const map = mapRef.current;
    if (map && measureLineRef.current) map.removeLayer(measureLineRef.current);
    measurePointsRef.current = [];
    measureLineRef.current = null;
  };

  // Render data layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layerObjs.current.forEach((l) => map.removeLayer(l));
    layerObjs.current = [];

    if (layers.municipios) {
      const lg = L.layerGroup();
      (municipios ?? []).filter((m) => m.latitude && m.longitude).forEach((m: any) => {
        L.marker([m.latitude!, m.longitude!])
          .bindPopup(`<strong>${m.nome}</strong><br/>Pop 2022: ${m.populacao_2022?.toLocaleString("pt-BR") || "n/d"}<br/>Eleitorado: ${m.eleitorado_total?.toLocaleString("pt-BR") || "n/d"}`)
          .addTo(lg);
      });
      lg.addTo(map);
      layerObjs.current.push(lg);
    }

    if (layers.bairros) {
      const lg = L.layerGroup();
      bairrosFiltrados.filter((b) => b.latitude && b.longitude).forEach((b: any) => {
        const color = layers.zonaUrbana
          ? zonaColors[b.zona_tipo || "desconhecido"]
          : classificacaoColors[b.classificacao || "baixa_presenca"];
        const m = L.circleMarker([b.latitude!, b.longitude!], {
          radius: 7, fillColor: color, color, fillOpacity: opacity, weight: 2,
        });
        const popupHtml = `
          <div style="min-width:200px">
            <strong>${b.nome}</strong><br/>
            Classif: ${classificacaoLabels[b.classificacao || "baixa_presenca"]}<br/>
            Zona: ${b.zona_tipo || "n/d"}<br/>
            Pop est: ${b.populacao_estimada?.toLocaleString("pt-BR") || "n/d"}
            <br/><button id="edit-bairro-${b.id}" style="margin-top:6px;padding:4px 8px;background:#3B82F6;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px">Editar</button>
          </div>`;
        m.bindPopup(popupHtml);
        m.on("popupopen", () => {
          setTimeout(() => {
            const btn = document.getElementById(`edit-bairro-${b.id}`);
            if (btn) btn.onclick = () => { setEditingBairro(b); m.closePopup(); };
          }, 50);
        });
        m.addTo(lg);
      });
      lg.addTo(map);
      layerObjs.current.push(lg);
    }

    if (layers.pessoasCluster && pessoas) {
      // @ts-ignore
      const cluster = (L as any).markerClusterGroup({ disableClusteringAtZoom: 14, chunkedLoading: true });
      pessoas.filter((p: any) => p.latitude && p.longitude).forEach((p: any) => {
        L.marker([p.latitude, p.longitude]).bindPopup(`<strong>${p.nome_completo || p.nome}</strong><br/>${p.bairro_nome || ""}`).addTo(cluster);
      });
      map.addLayer(cluster);
      layerObjs.current.push(cluster);
    }

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

    if (layers.densidade) {
      const lg = L.layerGroup();
      (municipios ?? []).filter((m: any) => m.latitude && m.longitude && m.eleitorado_total).forEach((m: any) => {
        const radius = Math.sqrt(m.eleitorado_total / 100);
        L.circle([m.latitude, m.longitude], {
          radius: radius * 100,
          fillColor: m.eleitorado_total > 50000 ? "#7C3AED" : m.eleitorado_total > 20000 ? "#3B82F6" : "#94A3B8",
          color: "#1E293B", weight: 1, fillOpacity: opacity * 0.6,
        }).bindPopup(`<strong>${m.nome}</strong><br/>Eleitorado: ${m.eleitorado_total.toLocaleString("pt-BR")}`).addTo(lg);
      });
      lg.addTo(map);
      layerObjs.current.push(lg);
    }

    if (layers.setores && setores) {
      const lg = L.layerGroup();
      setores.forEach((s: any) => {
        const coords = (s.geometria?.coordinates ?? []) as [number, number][];
        if (!coords.length) return;
        const poly = L.polygon(coords, { color: s.cor, fillColor: s.cor, fillOpacity: 0.25, weight: 2 });
        poly.bindPopup(`
          <div style="min-width:200px">
            <strong>${s.nome}</strong> <span style="background:${s.cor};color:white;padding:1px 6px;border-radius:8px;font-size:10px">${s.tipo}</span><br/>
            Área: ${s.area_km2?.toFixed(2) || "n/d"} km²<br/>
            Perímetro: ${s.perimetro_km?.toFixed(2) || "n/d"} km
            ${s.observacoes ? `<br/><em>${s.observacoes}</em>` : ""}
            <br/><button id="del-setor-${s.id}" style="margin-top:6px;padding:4px 8px;background:#EF4444;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px">Remover</button>
          </div>`);
        poly.on("popupopen", () => {
          setTimeout(() => {
            const btn = document.getElementById(`del-setor-${s.id}`);
            if (btn) btn.onclick = () => { if (confirm(`Remover setor "${s.nome}"?`)) deleteSetor.mutate(s.id); };
          }, 50);
        });
        poly.addTo(lg);
      });
      lg.addTo(map);
      layerObjs.current.push(lg);
    }
  }, [municipios, bairrosFiltrados, agenda, pessoas, demandas, layers, opacity, setores, deleteSetor]);

  const exportPng = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(mapElementRef.current!, { useCORS: true, scale: 2, logging: false });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a"); a.href = url; a.download = `mapa-${Date.now()}.png`; a.click();
      toast.success("Mapa exportado");
    } catch (e: any) { toast.error(`Falha: ${e.message}`); }
  };

  const exportGeoJSON = () => {
    const features: any[] = [];
    bairrosFiltrados.filter((b: any) => b.latitude && b.longitude).forEach((b: any) => {
      features.push({
        type: "Feature", properties: { tipo: "bairro", nome: b.nome, classificacao: b.classificacao },
        geometry: { type: "Point", coordinates: [b.longitude, b.latitude] },
      });
    });
    (setores ?? []).forEach((s: any) => {
      features.push({
        type: "Feature", properties: { tipo: "setor", nome: s.nome, cor: s.cor },
        geometry: { type: "Polygon", coordinates: [s.geometria.coordinates.map((c: [number, number]) => [c[1], c[0]])] },
      });
    });
    const geojson = { type: "FeatureCollection", features };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `mapa-${Date.now()}.geojson`; a.click();
    URL.revokeObjectURL(url); toast.success("GeoJSON exportado");
  };

  const aplicarCenario = (c: any) => {
    if (c.config.layers) setLayers(c.config.layers);
    if (typeof c.config.opacity === "number") setOpacity(c.config.opacity);
    if (c.config.filtroMunicipio) setFiltroMunicipio(c.config.filtroMunicipio);
    if (c.config.filtroClassif) setFiltroClassif(c.config.filtroClassif);
    if (c.config.basemap) setBasemap(c.config.basemap);
    if (c.config.center && c.config.zoom && mapRef.current) {
      mapRef.current.setView(c.config.center, c.config.zoom);
    }
    toast.success(`Cenário "${c.nome}" aplicado`);
  };

  const salvarCenario = () => {
    if (!cenarioNome.trim()) { toast.error("Informe um nome"); return; }
    const map = mapRef.current;
    const config = {
      layers, opacity, filtroMunicipio, filtroClassif, basemap,
      center: map ? [map.getCenter().lat, map.getCenter().lng] : center,
      zoom: map?.getZoom() || 7,
    };
    saveCenario.mutate({ nome: cenarioNome, config, publico: true }, {
      onSuccess: () => { setCenarioNome(""); setCenarioOpen(false); },
    });
  };

  const confirmarSetor = () => {
    if (!pendingSetor) return;
    if (!setorForm.nome.trim()) { toast.error("Informe o nome do setor"); return; }
    saveSetor.mutate({
      nome: setorForm.nome,
      tipo: setorForm.tipo,
      cor: setorForm.cor,
      observacoes: setorForm.observacoes || null,
      area_km2: pendingSetor.area,
      perimetro_km: pendingSetor.perimetro,
      geometria: { type: "Polygon", coordinates: pendingSetor.coords },
    } as any, {
      onSuccess: () => {
        if (drawnItemsRef.current) drawnItemsRef.current.clearLayers();
        setPendingSetor(null);
        setSetorForm({ nome: "", tipo: "setor", cor: "#3B82F6", observacoes: "" });
      },
    });
  };

  const salvarBairro = () => {
    if (!editingBairro) return;
    updateBairro.mutate({
      id: editingBairro.id,
      classificacao: editingBairro.classificacao,
      nome: editingBairro.nome,
    }, { onSuccess: () => setEditingBairro(null) });
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><MapIcon className="h-6 w-6 text-primary" /> Mapa Interativo</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Camadas, edição inline, desenho de setores, cenários salvos e exportação</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={basemap} onValueChange={(v) => setBasemap(v as BasemapKey)}>
              <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(BASEMAPS).map(([k, v]) => <SelectItem key={k} value={k}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Tooltip><TooltipTrigger asChild>
              <Button size="sm" variant={editMode ? "default" : "outline"} onClick={() => setEditMode(!editMode)}>
                <Pencil className="h-4 w-4 mr-1" />{editMode ? "Sair edição" : "Desenhar"}
              </Button>
            </TooltipTrigger><TooltipContent>Desenhar polígonos/setores</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button size="sm" variant={measureMode ? "default" : "outline"} onClick={() => { setMeasureMode(!measureMode); if (measureMode) clearMeasure(); }}>
                <Ruler className="h-4 w-4 mr-1" />{measureMode ? "Parar" : "Medir"}
              </Button>
            </TooltipTrigger><TooltipContent>Medir distância (clique para adicionar pontos)</TooltipContent></Tooltip>
            <Dialog open={cenarioOpen} onOpenChange={setCenarioOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Save className="h-4 w-4 mr-1" /> Salvar cenário</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Salvar cenário do mapa</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Label>Nome</Label>
                  <Input value={cenarioNome} onChange={(e) => setCenarioNome(e.target.value)} placeholder="Ex: Foco redutos zona urbana" />
                  <p className="text-xs text-muted-foreground">Salva as camadas ativas, filtros, basemap, zoom e centro atuais.</p>
                </div>
                <DialogFooter>
                  <Button onClick={salvarCenario} disabled={saveCenario.isPending}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" onClick={exportPng}><Camera className="h-4 w-4 mr-1" /> PNG</Button>
            <Button size="sm" variant="outline" onClick={exportGeoJSON}><FileJson className="h-4 w-4 mr-1" /> GeoJSON</Button>
          </div>
        </div>

        <div className="flex gap-4">
          <Card className={`shrink-0 transition-all overflow-hidden ${sidebarOpen ? "w-80" : "w-12"}`}>
            <CardContent className="p-3 space-y-3">
              <Button variant="ghost" size="sm" className="w-full justify-between" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen && <span className="text-xs font-semibold">Controles</span>}
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              {sidebarOpen && (
                <Tabs defaultValue="camadas">
                  <TabsList className="grid grid-cols-3 h-8">
                    <TabsTrigger value="camadas" className="text-[11px]"><Layers className="h-3 w-3 mr-1" />Camadas</TabsTrigger>
                    <TabsTrigger value="cenarios" className="text-[11px]"><Bookmark className="h-3 w-3 mr-1" />Cenários</TabsTrigger>
                    <TabsTrigger value="setores" className="text-[11px]">Setores</TabsTrigger>
                  </TabsList>

                  <TabsContent value="camadas" className="space-y-3 mt-3">
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground">Camadas</p>
                      {Object.entries(layers).map(([k, v]) => (
                        <label key={k} className="flex items-center gap-2 text-xs">
                          <Checkbox checked={v} onCheckedChange={(c) => setLayers({ ...layers, [k]: Boolean(c) } as LayersState)} />
                          {k === "pessoasCluster" ? "Cluster de pessoas" :
                           k === "demandasHeat" ? "Heatmap demandas" :
                           k === "densidade" ? "Densidade eleitoral" :
                           k === "zonaUrbana" ? "Cor por zona U/R" :
                           k === "setores" ? "Setores desenhados" :
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
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos municípios</SelectItem>
                          {(municipios ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={filtroClassif} onValueChange={setFiltroClassif}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas classificações</SelectItem>
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
                      Bairros: {bairrosFiltrados.length} · Municípios: {municipios?.length || 0} · Setores: {setores?.length || 0}
                    </div>
                  </TabsContent>

                  <TabsContent value="cenarios" className="space-y-2 mt-3">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Cenários salvos</p>
                    {(cenarios ?? []).length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Nenhum cenário ainda. Use o botão "Salvar cenário".</p>
                    )}
                    {(cenarios ?? []).map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 p-2 border rounded text-xs hover:bg-muted/40">
                        <button className="flex-1 text-left" onClick={() => aplicarCenario(c)}>
                          <div className="font-medium">{c.nome}</div>
                          {c.publico && <Badge variant="secondary" className="text-[9px] mt-0.5">público</Badge>}
                        </button>
                        <button onClick={() => { if (confirm(`Excluir "${c.nome}"?`)) deleteCenario.mutate(c.id); }} className="text-destructive hover:opacity-70">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="setores" className="space-y-2 mt-3">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Setores ({setores?.length || 0})</p>
                    <p className="text-[10px] text-muted-foreground">Ative "Desenhar" no topo e use a barra do mapa para criar polígonos.</p>
                    {(setores ?? []).map((s: any) => (
                      <div key={s.id} className="flex items-center gap-2 p-2 border rounded text-xs">
                        <span className="h-3 w-3 rounded" style={{ background: s.cor }} />
                        <div className="flex-1">
                          <div className="font-medium">{s.nome}</div>
                          <div className="text-[10px] text-muted-foreground">{s.area_km2?.toFixed(1)} km² · {s.perimetro_km?.toFixed(1)} km</div>
                        </div>
                        <button onClick={() => { if (confirm(`Excluir "${s.nome}"?`)) deleteSetor.mutate(s.id); }} className="text-destructive hover:opacity-70">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
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

        {/* Dialog: salvar setor após desenhar */}
        <Dialog open={!!pendingSetor} onOpenChange={(o) => { if (!o) { setPendingSetor(null); if (drawnItemsRef.current) drawnItemsRef.current.clearLayers(); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Salvar setor desenhado</DialogTitle></DialogHeader>
            {pendingSetor && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-muted rounded"><span className="text-muted-foreground">Área:</span> <strong>{pendingSetor.area.toFixed(2)} km²</strong></div>
                  <div className="p-2 bg-muted rounded"><span className="text-muted-foreground">Perímetro:</span> <strong>{pendingSetor.perimetro.toFixed(2)} km</strong></div>
                </div>
                <div>
                  <Label>Nome</Label>
                  <Input value={setorForm.nome} onChange={(e) => setSetorForm({ ...setorForm, nome: e.target.value })} placeholder="Ex: Zona Norte - Equipe A" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={setorForm.tipo} onValueChange={(v) => setSetorForm({ ...setorForm, tipo: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="setor">Setor de campanha</SelectItem>
                        <SelectItem value="reduto">Reduto</SelectItem>
                        <SelectItem value="expansao">Expansão</SelectItem>
                        <SelectItem value="risco">Risco</SelectItem>
                        <SelectItem value="evento">Área de evento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cor</Label>
                    <Input type="color" value={setorForm.cor} onChange={(e) => setSetorForm({ ...setorForm, cor: e.target.value })} className="h-8 p-1" />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={setorForm.observacoes} onChange={(e) => setSetorForm({ ...setorForm, observacoes: e.target.value })} rows={2} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setPendingSetor(null); if (drawnItemsRef.current) drawnItemsRef.current.clearLayers(); }}>Cancelar</Button>
              <Button onClick={confirmarSetor} disabled={saveSetor.isPending}><Plus className="h-4 w-4 mr-1" />Salvar setor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: editar bairro */}
        <Dialog open={!!editingBairro} onOpenChange={(o) => { if (!o) setEditingBairro(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar bairro</DialogTitle></DialogHeader>
            {editingBairro && (
              <div className="space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={editingBairro.nome} onChange={(e) => setEditingBairro({ ...editingBairro, nome: e.target.value })} />
                </div>
                <div>
                  <Label>Classificação</Label>
                  <Select value={editingBairro.classificacao || "baixa_presenca"} onValueChange={(v) => setEditingBairro({ ...editingBairro, classificacao: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(classificacaoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingBairro(null)}>Cancelar</Button>
              <Button onClick={salvarBairro} disabled={updateBairro.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
