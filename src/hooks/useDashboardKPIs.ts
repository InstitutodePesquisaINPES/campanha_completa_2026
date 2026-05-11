import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Agregador de KPIs reais para o dashboard inicial e visões executivas.
 * Cobre: territorial, CRM, demandas, agenda, financeiro, comunicação,
 * plano de campanha, comando e itens do usuário logado.
 */
export interface DashboardKPIs {
  // Volume
  municipios: number;
  pessoas: number;
  materiais: number;
  // Demandas
  demandasTotal: number;
  demandasAbertas: number;
  demandasUrgentes: number;
  demandasResolvidasMes: number;
  // Agenda
  eventosFuturos: number;
  eventosHoje: number;
  // Plano
  campanhaId: string | null;
  campanhaNome: string | null;
  metaVotos: number | null;
  diasParaEleicao: number | null;
  pctExecucao: number;
  tarefasAtrasadas: number;
  tarefasTotal: number;
  proximoMarcoTitulo: string | null;
  proximoMarcoDias: number | null;
  // Financeiro
  totalGasto: number;
  orcamentoTotal: number;
  pctOrcamento: number;
  contratosVencendo: number;
  // Comunicação
  pecasPendentes: number;
  mencoesAbertas: number;
  // Inteligência
  liderancasA: number;
}

export function useDashboardKPIs() {
  // Polling at 30s intervals as a substitute for WebSocket realtime.
  // Future: migrate to NestJS WebSocket Gateway for push-based updates.
  return useQuery<DashboardKPIs>({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const data = await api.get<DashboardKPIs>('/dashboard/kpis');
      return data || {
        municipios: 0, pessoas: 0, materiais: 0,
        demandasTotal: 0, demandasAbertas: 0, demandasUrgentes: 0, demandasResolvidasMes: 0,
        eventosFuturos: 0, eventosHoje: 0,
        campanhaId: null, campanhaNome: null, metaVotos: null,
        diasParaEleicao: null, pctExecucao: 0, tarefasAtrasadas: 0, tarefasTotal: 0,
        proximoMarcoTitulo: null, proximoMarcoDias: null,
        totalGasto: 0, orcamentoTotal: 0, pctOrcamento: 0, contratosVencendo: 0,
        pecasPendentes: 0, mencoesAbertas: 0, liderancasA: 0,
      };
    },
    refetchInterval: 30000, // Poll every 30s
    staleTime: 30000,
  });
}

/**
 * Itens do usuário logado: demandas atribuídas, eventos próprios, tarefas onde é responsável.
 */
export function useMeusItens() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["meus-itens", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const data = await api.get<any>('/dashboard/meus-itens');
      return {
        demandas: data?.demandas || [],
        eventos: data?.eventos || [],
      };
    },
    refetchInterval: 30000, // Poll every 30s
    staleTime: 30000,
  });
}
