import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useMunicipios, useBairros } from "@/hooks/useTerritorio";
import { useAgendaItems } from "@/hooks/useAgenda";

// Fix leaflet default icon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const classificacaoColors: Record<string, string> = {
  reduto: "#10B981",
  expansao: "#3B82F6",
  disputa: "#F59E0B",
  risco: "#EF4444",
  baixa_presenca: "#6B7280",
};

const classificacaoLabels: Record<string, string> = {
  reduto: "Reduto",
  expansao: "Expansão",
  disputa: "Disputa",
  risco: "Risco",
  baixa_presenca: "Baixa Presença",
};

function createPopupContent(title: string, lines: string[]) {
  const wrapper = document.createElement("div");
  const heading = document.createElement("strong");
  heading.textContent = title;
  wrapper.appendChild(heading);

  lines.filter(Boolean).forEach((line) => {
    const paragraph = document.createElement("p");
    paragraph.className = "text-xs";
    paragraph.textContent = line;
    wrapper.appendChild(paragraph);
  });

  return wrapper;
}

export function MapaInterativo() {
  const { data: municipios } = useMunicipios();
  const { data: bairros } = useBairros();
  const { data: agenda } = useAgendaItems();

  const [showMunicipios, setShowMunicipios] = useState(true);
  const [showBairros, setShowBairros] = useState(true);
  const [showAgenda, setShowAgenda] = useState(true);

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<L.LayerGroup[]>([]);

  const center = useMemo(() => {
    const municipioComCoordenadas = municipios?.find((m) => m.latitude != null && m.longitude != null);
    if (municipioComCoordenadas) {
      return [municipioComCoordenadas.latitude as number, municipioComCoordenadas.longitude as number] as [number, number];
    }
    return [-15.78, -47.93] as [number, number];
  }, [municipios]);

  const municipiosWithCoords = useMemo(
    () => (municipios ?? []).filter((m) => m.latitude != null && m.longitude != null),
    [municipios],
  );
  const bairrosWithCoords = useMemo(
    () => (bairros ?? []).filter((b) => b.latitude != null && b.longitude != null),
    [bairros],
  );
  const agendaWithCoords = useMemo(
    () => (agenda ?? []).filter((a) => a.latitude != null && a.longitude != null),
    [agenda],
  );

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    const map = L.map(mapElementRef.current, { scrollWheelZoom: true }).setView(center, 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      layerGroupsRef.current.forEach((layerGroup) => layerGroup.remove());
      layerGroupsRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, mapRef.current.getZoom());
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layerGroupsRef.current.forEach((layerGroup) => layerGroup.remove());
    layerGroupsRef.current = [];

    if (showMunicipios) {
      const municipiosLayer = L.layerGroup();
      municipiosWithCoords.forEach((municipio) => {
        L.marker([municipio.latitude as number, municipio.longitude as number])
          .bindPopup(
            createPopupContent(municipio.nome, [
              municipio.populacao ? `Pop: ${municipio.populacao.toLocaleString("pt-BR")}` : "",
              municipio.eleitorado_total
                ? `Eleitorado: ${municipio.eleitorado_total.toLocaleString("pt-BR")}`
                : "",
            ]),
          )
          .addTo(municipiosLayer);
      });
      municipiosLayer.addTo(map);
      layerGroupsRef.current.push(municipiosLayer);
    }

    if (showBairros) {
      const bairrosLayer = L.layerGroup();
      bairrosWithCoords.forEach((bairro) => {
        const color = classificacaoColors[bairro.classificacao || "baixa_presenca"] || classificacaoColors.baixa_presenca;
        L.circleMarker([bairro.latitude as number, bairro.longitude as number], {
          radius: 8,
          fillColor: color,
          color,
          fillOpacity: 0.7,
          weight: 2,
        })
          .bindPopup(
            createPopupContent(bairro.nome, [
              bairro.classificacao ? `Classif: ${classificacaoLabels[bairro.classificacao]}` : "",
            ]),
          )
          .addTo(bairrosLayer);
      });
      bairrosLayer.addTo(map);
      layerGroupsRef.current.push(bairrosLayer);
    }

    if (showAgenda) {
      const agendaLayer = L.layerGroup();
      agendaWithCoords.forEach((item) => {
        L.circleMarker([item.latitude as number, item.longitude as number], {
          radius: 6,
          fillColor: "#F59E0B",
          color: "#F59E0B",
          fillOpacity: 0.8,
          weight: 2,
        })
          .bindPopup(
            createPopupContent(item.titulo, [
              `${item.tipo} — ${item.status}`,
              item.local || "",
            ]),
          )
          .addTo(agendaLayer);
      });
      agendaLayer.addTo(map);
      layerGroupsRef.current.push(agendaLayer);
    }
  }, [agendaWithCoords, bairrosWithCoords, municipiosWithCoords, showAgenda, showBairros, showMunicipios]);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Mapa Interativo</h1>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={showMunicipios} onCheckedChange={(value) => setShowMunicipios(Boolean(value))} />
          Municípios ({municipiosWithCoords.length})
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={showBairros} onCheckedChange={(value) => setShowBairros(Boolean(value))} />
          Bairros ({bairrosWithCoords.length})
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={showAgenda} onCheckedChange={(value) => setShowAgenda(Boolean(value))} />
          Eventos ({agendaWithCoords.length})
        </label>

        <div className="ml-auto flex gap-2">
          {Object.entries(classificacaoColors).map(([key, color]) => (
            <Badge key={key} variant="outline" className="text-[10px]" style={{ borderColor: color, color }}>
              {classificacaoLabels[key]}
            </Badge>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div style={{ height: "calc(100vh - 260px)", minHeight: 400 }}>
            <div ref={mapElementRef} className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

