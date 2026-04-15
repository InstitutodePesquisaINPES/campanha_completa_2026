import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin } from "lucide-react";
import { MunicipiosTab } from "@/components/territorial/MunicipiosTab";
import { BairrosTab } from "@/components/territorial/BairrosTab";
import { ZonasTab } from "@/components/territorial/ZonasTab";
import { AreasTab } from "@/components/territorial/AreasTab";

export default function TerritoriosPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          Cadastro Territorial
        </h1>

        <Tabs defaultValue="municipios">
          <TabsList className="flex-wrap">
            <TabsTrigger value="municipios">Municípios</TabsTrigger>
            <TabsTrigger value="bairros">Bairros</TabsTrigger>
            <TabsTrigger value="zonas">Zonas & Seções</TabsTrigger>
            <TabsTrigger value="areas">Áreas de Atuação</TabsTrigger>
          </TabsList>
          <TabsContent value="municipios"><MunicipiosTab /></TabsContent>
          <TabsContent value="bairros"><BairrosTab /></TabsContent>
          <TabsContent value="zonas"><ZonasTab /></TabsContent>
          <TabsContent value="areas"><AreasTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
