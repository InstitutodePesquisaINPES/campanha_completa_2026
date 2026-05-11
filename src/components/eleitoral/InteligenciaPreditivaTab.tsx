import { useQuocienteEleitoral } from "@/hooks/useEleitoralTSE";
import { usePessoas } from "@/hooks/usePessoas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, Target, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function InteligenciaPreditivaTab({
  uf,
  ano,
  codMunicipio,
  cargo,
}: {
  uf: string;
  ano: number;
  codMunicipio?: string;
  cargo?: string;
}) {
  const { data: qeData, isLoading: isLoadingQe } = useQuocienteEleitoral(uf, ano, codMunicipio, cargo);
  const { data: crmPessoas = [], isLoading: isLoadingCrm } = usePessoas();

  if (!codMunicipio || !cargo) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Selecione um município e um cargo (ex: Vereador) nos filtros acima para calcular a predição.
      </div>
    );
  }

  if (isLoadingQe || isLoadingCrm) return <Skeleton className="h-96" />;

  const qe = qeData?.quocienteEleitoral || 0;
  const qp = qeData?.quocientePartidario || 0;
  const vagas = qeData?.vagas || 0;
  const votosValidos = qeData?.votosValidos || 0;
  
  // Viability calculation
  const totalCrm = crmPessoas.length;
  const targetVotes = qp > 0 ? qp : 1; // Assuming QP is the minimum target to elect. Usually QE is for the party, QP is 10% of QE for the individual. If user uses this for individual targets, let's use QP.
  
  const viabilityPct = Math.min((totalCrm / targetVotes) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{votosValidos.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">Votos Válidos Históricos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full"><Target className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{vagas}</p>
              <p className="text-xs text-muted-foreground">Vagas (Cadeiras Eleitas)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-primary p-3 rounded-full"><Calculator className="h-5 w-5 text-primary-foreground" /></div>
            <div>
              <p className="text-2xl font-bold text-primary">{qe.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground font-semibold">Quociente Eleitoral (QE)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-warning/10 border-warning/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-warning p-3 rounded-full"><Target className="h-5 w-5 text-warning-foreground" /></div>
            <div>
              <p className="text-2xl font-bold text-warning-foreground">{qp.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-warning-foreground font-semibold">Corte (10% do QE)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Termômetro de Viabilidade da Campanha</CardTitle>
          <CardDescription>Compara a base atual do seu CRM com a meta estatística mínima de votos (Corte de 10% do QE) para {cargo}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progresso da Base de Apoiadores</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-4xl font-bold">{totalCrm.toLocaleString('pt-BR')}</span>
                  <span className="text-muted-foreground">/ {qp.toLocaleString('pt-BR')} votos necessários</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">{viabilityPct.toFixed(1)}%</span>
              </div>
            </div>
            
            <Progress value={viabilityPct} className="h-4" />
            
            <div className="flex items-center gap-2 mt-4 text-sm">
              {viabilityPct >= 100 ? (
                <div className="flex items-center gap-2 text-success bg-success/10 px-3 py-2 rounded-md w-full">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Sua base de CRM já atingiu o corte estatístico mínimo! O foco agora é garantir o comparecimento (combater abstenção) no Dia D.</span>
                </div>
              ) : viabilityPct >= 50 ? (
                <div className="flex items-center gap-2 text-warning bg-warning/10 px-3 py-2 rounded-md w-full">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Viabilidade média. Você precisa dobrar o esforço de captação de contatos pela equipe de rua e lideranças.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-3 py-2 rounded-md w-full">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Atenção: A base atual é muito inferior à meta matemática. Expanda urgentemente as campanhas de mobilização e cadastro de novos apoiadores.</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
