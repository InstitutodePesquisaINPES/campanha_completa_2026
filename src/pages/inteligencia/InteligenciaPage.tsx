import { AppLayout } from "@/components/layout/AppLayout";
import { HeatmapLacunas } from "@/components/inteligencia/HeatmapLacunas";
import { LacunasTable } from "@/components/inteligencia/LacunasTable";
import { Brain } from "lucide-react";

export default function InteligenciaPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            Inteligência Territorial
          </h1>
          <p className="text-sm text-muted-foreground">
            Onde a campanha precisa de presença urgente — cruzamento de demandas, cobertura e classificação estratégica.
          </p>
        </div>
        <HeatmapLacunas />
        <LacunasTable />
      </div>
    </AppLayout>
  );
}
