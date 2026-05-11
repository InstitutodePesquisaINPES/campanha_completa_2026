import { CampanhaHero } from "@/components/brand/CampanhaHero";
import { ConsultorBriefing } from "@/components/brand/ConsultorBriefing";
import { useUserRoles, useCanManage } from "@/hooks/useUserRoles";
import { useDashboardKPIs } from "@/hooks/useDashboardKPIs";
import { useProfile } from "@/hooks/useProfile";
import { KPIClusterCard } from "./KPIClusterCard";
import { QuickActions } from "./QuickActions";
import { AlertasCriticos } from "./AlertasCriticos";
import { MeusItens } from "./MeusItens";
import {
  MapPin, Users, ClipboardList, Calendar, Package, Vote, Wallet,
  MessageSquare, Flag, TrendingUp, Target, Crown,
} from "lucide-react";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

/**
 * Dashboard por perfil. Renderiza blocos diferentes conforme as roles do usuário.
 * - admin/candidato/coord_geral: visão completa
 * - coordenadores específicos: visão setorial
 * - lideranças/cabos: visão de campo e metas
 * - operadores: visão de tarefas
 */
export function RoleBasedDashboard() {
  const { data: profile } = useProfile();
  const { data: roles = [] } = useUserRoles();
  const canManage = useCanManage();
  const { data: kpis, isLoading } = useDashboardKPIs();

  const isAdmin = roles.includes("admin");
  const isCandidato = roles.includes("candidato");
  const isCoordGeral = roles.includes("coord_geral");
  const isExecutivo = isAdmin || isCandidato || isCoordGeral;

  const isCoordFin = roles.includes("coord_financeiro");
  const isCoordCom = roles.includes("coord_comunicacao");
  const isCoordMob = roles.includes("coord_mobilizacao");
  const isCampo = roles.includes("lideranca_regional") || roles.includes("lideranca_local") || roles.includes("cabo_eleitoral");

  const roleLabel =
    isAdmin ? "Administração geral"
    : isCandidato ? "Candidato"
    : isCoordGeral ? "Coordenação geral"
    : isCoordFin ? "Coordenação Financeira"
    : isCoordCom ? "Coordenação de Comunicação"
    : isCoordMob ? "Coordenação de Mobilização"
    : isCampo ? "Operação de Campo"
    : roles[0] ? roles[0].replace("_", " ") : "Visualização";

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <CampanhaHero />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {isExecutivo && <Crown className="h-5 w-5 text-warning" />}
            Bom trabalho, {profile?.full_name?.split(" ")[0] || "comandante"} 👊
          </h2>
          <p className="text-sm text-muted-foreground">{roleLabel} · Comitê Kiribamba · Avante BA</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {kpis?.campanhaId && (
            <Link to="/plano">
              <Badge className="brand-yellow-gradient text-foreground hover:opacity-90 cursor-pointer gap-1">
                <Vote className="h-3 w-3" /> Plano de campanha
              </Badge>
            </Link>
          )}
          <Link to="/comando">
            <Badge variant="outline" className="cursor-pointer gap-1 hover:border-primary/40">
              <TrendingUp className="h-3 w-3" /> Sala de situação
            </Badge>
          </Link>
        </div>
      </div>

      {/* GRID PRINCIPAL DE KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Campanha — só pra quem gerencia */}
        {isExecutivo && kpis?.campanhaId && (
          <>
            <KPIClusterCard
              icon={Target} label="Meta de votos"
              value={kpis.metaVotos?.toLocaleString("pt-BR") ?? "—"}
              sub={kpis.diasParaEleicao !== null ? `D-${kpis.diasParaEleicao} eleição` : ""}
              href="/plano" tone="warning" loading={isLoading}
            />
            <KPIClusterCard
              icon={Flag} label="Execução do plano"
              value={`${kpis.pctExecucao}%`}
              sub={kpis.tarefasAtrasadas > 0 ? `${kpis.tarefasAtrasadas} atrasadas` : "no prazo"}
              href="/plano" progress={kpis.pctExecucao}
              tone={kpis.tarefasAtrasadas > 0 ? "destructive" : "success"} loading={isLoading}
            />
          </>
        )}
        <KPIClusterCard
          icon={ClipboardList} label="Demandas ativas"
          value={kpis?.demandasAbertas ?? 0}
          sub={`${kpis?.demandasUrgentes ?? 0} urgentes · ${kpis?.demandasResolvidasMes ?? 0} resolvidas/mês`}
          href="/demandas" tone={kpis && kpis.demandasUrgentes > 0 ? "destructive" : "warning"}
          loading={isLoading}
        />
        <KPIClusterCard
          icon={Calendar} label="Agenda futura"
          value={kpis?.eventosFuturos ?? 0}
          sub={`${kpis?.eventosHoje ?? 0} hoje`}
          href="/agenda" tone="primary" loading={isLoading}
        />
        <KPIClusterCard
          icon={Users} label="Eleitores no CRM"
          value={kpis?.pessoas ?? 0}
          sub={kpis?.metaVotos ? `${(((kpis.pessoas) / Math.max(1, kpis.metaVotos)) * 100).toFixed(0)}% da meta` : "base CRM"}
          href="/pessoas" tone="success" loading={isLoading}
        />
        <KPIClusterCard
          icon={MapPin} label="Municípios"
          value={kpis?.municipios ?? 0}
          sub={kpis?.liderancasA ? `${kpis.liderancasA} lideranças A` : "mapeados"}
          href="/territorios" tone="info" loading={isLoading}
        />

        {/* Visões executivas e setoriais */}
        {(isExecutivo || isCoordFin) && (
          <KPIClusterCard
            icon={Wallet} label="Orçamento"
            value={`${(kpis?.pctOrcamento ?? 0).toFixed(0)}%`}
            sub={kpis?.contratosVencendo ? `${kpis.contratosVencendo} contratos vencendo` : "no limite"}
            href="/financeiro"
            progress={kpis?.pctOrcamento}
            tone={kpis && kpis.pctOrcamento > 85 ? "destructive" : "primary"}
            loading={isLoading}
          />
        )}
        
        {(isExecutivo || isCoordCom) && (
          <KPIClusterCard
            icon={MessageSquare} label="Comunicação"
            value={(kpis?.pecasPendentes ?? 0) + (kpis?.mencoesAbertas ?? 0)}
            sub={`${kpis?.pecasPendentes ?? 0} peças · ${kpis?.mencoesAbertas ?? 0} menções`}
            href="/comunicacao" tone="info" loading={isLoading}
          />
        )}
        
        {(isExecutivo || isCoordMob || isCoordCom) && (
          <KPIClusterCard
            icon={Package} label="Materiais ativos"
            value={kpis?.materiais ?? 0}
            sub="catálogo"
            href="/materiais" tone="info" loading={isLoading}
          />
        )}
      </div>

      {/* CONTEÚDO INFERIOR — depende do papel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coluna principal: Briefing pra todo mundo */}
        <div className="lg:col-span-2 space-y-4">
          <ConsultorBriefing />
          {kpis && <AlertasCriticos kpis={kpis} />}
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">
          {canManage && <QuickActions />}
          <MeusItens />
        </div>
      </div>
    </div>
  );
}
