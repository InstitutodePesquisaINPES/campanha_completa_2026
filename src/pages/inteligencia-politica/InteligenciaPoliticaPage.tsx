import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Brain, MapPin, Users, Vote, Settings2 } from "lucide-react";
import { useCampanhas } from "@/hooks/useCampanhas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MunicipiosEstrategicosTab } from "@/components/inteligencia-politica/MunicipiosEstrategicosTab";
import { LiderancasTab } from "@/components/inteligencia-politica/LiderancasTab";
import { VereadoresHistoricosTab } from "@/components/inteligencia-politica/VereadoresHistoricosTab";
import { ConfiguracaoPlano } from "@/components/plano/ConfiguracaoPlano";

export default function InteligenciaPoliticaPage() {
  const { data: campanhas = [] } = useCampanhas();
  const [campanhaId, setCampanhaId] = useState<string>("");

  // Auto-selecionar primeira campanha
  if (!campanhaId && campanhas.length > 0) {
    setCampanhaId(campanhas[0].id);
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6 max-w-[1500px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Brain className="h-7 w-7 text-primary" />
                Inteligência Política
              </h1>
              <p className="text-muted-foreground mt-1">
                Diagnóstico territorial · Lideranças · Vereadores históricos · Configuração do plano
              </p>
            </div>
            <Select value={campanhaId} onValueChange={setCampanhaId}>
              <SelectTrigger className="w-72"><SelectValue placeholder="Selecione uma campanha" /></SelectTrigger>
              <SelectContent>
                {campanhas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {!campanhaId ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Selecione uma campanha para começar.</p>
            </Card>
          ) : (
            <Tabs defaultValue="municipios" className="space-y-4">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-3xl">
                <TabsTrigger value="municipios"><MapPin className="h-3.5 w-3.5 mr-1.5" /> Municípios</TabsTrigger>
                <TabsTrigger value="liderancas"><Users className="h-3.5 w-3.5 mr-1.5" /> Lideranças</TabsTrigger>
                <TabsTrigger value="vereadores"><Vote className="h-3.5 w-3.5 mr-1.5" /> Vereadores</TabsTrigger>
                <TabsTrigger value="config"><Settings2 className="h-3.5 w-3.5 mr-1.5" /> Plano</TabsTrigger>
              </TabsList>
              <TabsContent value="municipios"><MunicipiosEstrategicosTab campanhaId={campanhaId} /></TabsContent>
              <TabsContent value="liderancas"><LiderancasTab campanhaId={campanhaId} /></TabsContent>
              <TabsContent value="vereadores"><VereadoresHistoricosTab /></TabsContent>
              <TabsContent value="config"><ConfiguracaoPlano campanhaId={campanhaId} /></TabsContent>
            </Tabs>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
