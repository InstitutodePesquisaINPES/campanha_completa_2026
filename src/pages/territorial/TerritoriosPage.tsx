import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Target, Building2, Home, Vote, Users, Download } from "lucide-react";
import { MunicipiosTab } from "@/components/territorial/MunicipiosTab";
import { BairrosTab } from "@/components/territorial/BairrosTab";
import { ZonasTab } from "@/components/territorial/ZonasTab";
import { AreasTab } from "@/components/territorial/AreasTab";
import { TerritorioHeader } from "@/components/territorial/TerritorioHeader";
import { VisaoEstrategicaTab } from "@/components/territorial/VisaoEstrategicaTab";
import { ImportIBGETab } from "@/components/territorial/ImportIBGETab";
import { ImportBairrosTab } from "@/components/territorial/ImportBairrosTab";

export default function TerritoriosPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              Comando Territorial
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Microrregião de Vitória da Conquista · gestão estratégica de cobertura, bairros e áreas operacionais
            </p>
          </div>
        </div>

        <TerritorioHeader />

        <Tabs defaultValue="estrategia">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="estrategia"><Target className="h-3.5 w-3.5 mr-1" />Visão Estratégica</TabsTrigger>
            <TabsTrigger value="municipios"><Building2 className="h-3.5 w-3.5 mr-1" />Municípios</TabsTrigger>
            <TabsTrigger value="bairros"><Home className="h-3.5 w-3.5 mr-1" />Bairros</TabsTrigger>
            <TabsTrigger value="zonas"><Vote className="h-3.5 w-3.5 mr-1" />Zonas & Seções</TabsTrigger>
            <TabsTrigger value="areas"><Users className="h-3.5 w-3.5 mr-1" />Áreas de Atuação</TabsTrigger>
            <TabsTrigger value="importar"><Download className="h-3.5 w-3.5 mr-1" />Importar</TabsTrigger>
          </TabsList>
          <TabsContent value="estrategia" className="space-y-4">
            <VisaoEstrategicaTab />
          </TabsContent>
          <TabsContent value="municipios" className="space-y-4">
            <MunicipiosTab />
          </TabsContent>
          <TabsContent value="bairros"><BairrosTab /></TabsContent>
          <TabsContent value="zonas"><ZonasTab /></TabsContent>
          <TabsContent value="areas"><AreasTab /></TabsContent>
          <TabsContent value="importar" className="space-y-4">
            <ImportIBGETab />
            <ImportBairrosTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
