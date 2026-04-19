import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContratosTab } from "@/components/compliance/ContratosTab";
import { RiscosTab } from "@/components/compliance/RiscosTab";
import { IncidentesTab } from "@/components/compliance/IncidentesTab";
import { ShieldCheck } from "lucide-react";

export default function CompliancePage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Compliance & Riscos
          </h1>
          <p className="text-sm text-muted-foreground">Contratos, matriz de riscos e registro de incidentes — base probatória da campanha.</p>
        </div>
        <Tabs defaultValue="contratos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contratos">Contratos</TabsTrigger>
            <TabsTrigger value="riscos">Riscos</TabsTrigger>
            <TabsTrigger value="incidentes">Incidentes</TabsTrigger>
          </TabsList>
          <TabsContent value="contratos"><ContratosTab /></TabsContent>
          <TabsContent value="riscos"><RiscosTab /></TabsContent>
          <TabsContent value="incidentes"><IncidentesTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
