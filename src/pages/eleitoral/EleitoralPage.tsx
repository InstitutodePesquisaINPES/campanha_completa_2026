import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useCampanhaAtiva } from "@/hooks/useCampanhas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EleitoralFilters, type Modo } from "@/components/eleitoral/EleitoralFilters";
import { MunicipioPicker } from "@/components/eleitoral/MunicipioPicker";
import { VisaoGeralTab } from "@/components/eleitoral/VisaoGeralTab";
import { CandidatosTab } from "@/components/eleitoral/CandidatosTab";
import { PerfilEleitoradoTab } from "@/components/eleitoral/PerfilEleitoradoTab";
import { OrigemVotosTab } from "@/components/eleitoral/OrigemVotosTab";
import { LocaisVotacaoTab } from "@/components/eleitoral/LocaisVotacaoTab";
import { ComparativoTab } from "@/components/eleitoral/ComparativoTab";

export default function EleitoralPage() {
  const { data: campanhaAtiva } = useCampanhaAtiva();
  const [modo, setModo] = useState<Modo>("territorio");
  const [uf, setUf] = useState("BA");
  const [ano, setAno] = useState(2024);
  const [cargo, setCargo] = useState<string | undefined>();
  const [aba, setAba] = useState("visao");
  const [municipioPick, setMunicipioPick] = useState<{ cod: string; nome: string } | null>(null);

  useEffect(() => {
    if (campanhaAtiva?.data_eleicao) {
      setAno(new Date(campanhaAtiva.data_eleicao).getFullYear());
    }
  }, [campanhaAtiva?.data_eleicao]);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Eleitoral TSE</h1>
            <p className="text-sm text-muted-foreground">Visão 360° de candidatos, eleitorado e resultados — interligado ao CRM e à inteligência territorial.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <EleitoralFilters
              modo={modo} setModo={setModo}
              uf={uf} setUf={setUf}
              ano={ano} setAno={setAno}
              cargo={cargo} setCargo={setCargo}
            />
            <MunicipioPicker uf={uf} ano={ano} value={municipioPick} onChange={setMunicipioPick} />
          </div>

          {municipioPick && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                Município ativo: <strong>{municipioPick.nome}</strong>
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => setMunicipioPick(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          )}

          <Tabs value={aba} onValueChange={setAba}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="visao">Visão Geral</TabsTrigger>
              <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
              <TabsTrigger value="eleitorado">Perfil do Eleitorado</TabsTrigger>
              <TabsTrigger value="comparativo">Comparativo entre Eleições</TabsTrigger>
              <TabsTrigger value="origem">Origem de Votos (Zona/Seção)</TabsTrigger>
              <TabsTrigger value="locais">Locais de Votação</TabsTrigger>
            </TabsList>

            <TabsContent value="visao" className="mt-4">
              <VisaoGeralTab uf={uf} ano={ano} onPickMunicipio={(cod, nome) => { setMunicipioPick({ cod, nome }); setAba("candidatos"); }} />
            </TabsContent>
            <TabsContent value="candidatos" className="mt-4">
              <CandidatosTab uf={uf} ano={ano} cargo={cargo} codMunicipio={municipioPick?.cod} />
            </TabsContent>
            <TabsContent value="eleitorado" className="mt-4">
              <PerfilEleitoradoTab uf={uf} ano={ano} municipio={municipioPick?.nome} />
            </TabsContent>
            <TabsContent value="comparativo" className="mt-4">
              <ComparativoTab uf={uf} municipio={municipioPick?.nome} cargo={cargo} />
            </TabsContent>
            <TabsContent value="origem" className="mt-4">
              <OrigemVotosTab uf={uf} ano={ano} cargo={cargo} codMunicipio={municipioPick?.cod} />
            </TabsContent>
            <TabsContent value="locais" className="mt-4">
              <LocaisVotacaoTab uf={uf} ano={ano} codMunicipio={municipioPick?.cod} />
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
