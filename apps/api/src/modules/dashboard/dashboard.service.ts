import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKPIs(tenantId: string) {
    const hoje = new Date();
    const fimDoDia = new Date(hoje);
    fimDoDia.setHours(23, 59, 59, 999);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const proximos30 = new Date(hoje.getTime() + 30 * 86400000);

    const [
      municipios,
      pessoas,
      materiais,
      demandasTotal,
      demandasAbertas,
      demandasUrgentes,
      demandasResolvidasMes,
      eventosFuturos,
      eventosHoje,
      campanhaAtiva,
      liderancasA,
    ] = await Promise.all([
      this.prisma.municipioEstrategico.count({ where: { tenantId } }),
      this.prisma.pessoa.count({ where: { tenantId } }),
      this.prisma.material.count({ where: { tenantId } }),
      this.prisma.demanda.count({ where: { tenantId } }),
      this.prisma.demanda.count({
        where: {
          tenantId,
          status: { in: ['aberta', 'triagem', 'encaminhada', 'em_andamento'] },
        },
      }),
      this.prisma.demanda.count({
        where: {
          tenantId,
          prioridade: 'urgente',
          status: { in: ['aberta', 'triagem', 'encaminhada', 'em_andamento'] },
        },
      }),
      this.prisma.demanda.count({
        where: {
          tenantId,
          status: 'resolvida',
          dataResolucao: { gte: inicioMes },
        },
      }),
      this.prisma.agenda.count({
        where: { tenantId, dataInicio: { gte: hoje } },
      }),
      this.prisma.agenda.count({
        where: { tenantId, dataInicio: { gte: hoje, lte: fimDoDia } },
      }),
      this.prisma.campanha.findFirst({
        where: { tenantId, ativa: true },
        orderBy: { createdAt: 'desc' },
        include: {
          tarefas: true,
          // despesas: { where: { dataDespesa: { gte: inicioMes } } },
        },
      }),
      this.prisma.pessoa.count({
        where: { tenantId, nivelRelacionamento: 'aliado', isLideranca: true },
      }),
    ]);

    let pctExecucao = 0,
      tarefasAtrasadas = 0,
      tarefasTotal = 0;
    let proximoMarcoTitulo: string | null = null;
    let proximoMarcoDias: number | null = null;
    let diasParaEleicao: number | null = null;
    let totalGasto = 0;
    let contratosVencendo = 0;

    if (campanhaAtiva) {
      if (campanhaAtiva.dataEleicao) {
        diasParaEleicao = Math.ceil(
          (campanhaAtiva.dataEleicao.getTime() - hoje.getTime()) / 86400000,
        );
      }

      const tarefas: any[] = (campanhaAtiva as any).tarefas || [];
      tarefasTotal = tarefas.length;
      const concluidas = tarefas.filter((t: any) => t.dataConclusao).length;
      pctExecucao =
        tarefasTotal > 0 ? Math.round((concluidas / tarefasTotal) * 100) : 0;
      tarefasAtrasadas = tarefas.filter(
        (t: any) => !t.dataConclusao && t.dataPrevista && t.dataPrevista < hoje,
      ).length;

      const proximoMarco = tarefas
        .filter(
          (t: any) =>
            t.isMarco &&
            !t.dataConclusao &&
            t.dataPrevista &&
            t.dataPrevista >= hoje,
        )
        .sort(
          (a: any, b: any) =>
            (a.dataPrevista?.getTime() || 0) - (b.dataPrevista?.getTime() || 0),
        )[0];

      if (proximoMarco && proximoMarco.dataPrevista) {
        proximoMarcoTitulo = proximoMarco.oQueE || proximoMarco.titulo;
        proximoMarcoDias = Math.ceil(
          (proximoMarco.dataPrevista.getTime() - hoje.getTime()) / 86400000,
        );
      }

      totalGasto = ((campanhaAtiva as any).despesas || []).reduce(
        (s: number, d: any) => s + Number(d.valor || 0),
        0,
      );
      contratosVencendo = (campanhaAtiva as any).contratos?.length || 0;
    }

    const orcamentoTotal = Number((campanhaAtiva as any)?.orcamentoTotal ?? 0);
    const pctOrcamento =
      orcamentoTotal > 0
        ? Math.min(100, (totalGasto / orcamentoTotal) * 100)
        : 0;

    // Fake zero for modules we don't have prisma models for yet (e.g. comunicacao)
    const pecasPendentes = 0;
    const mencoesAbertas = 0;

    return {
      municipios,
      pessoas,
      materiais,
      demandasTotal,
      demandasAbertas,
      demandasUrgentes,
      demandasResolvidasMes,
      eventosFuturos,
      eventosHoje,
      campanhaId: campanhaAtiva?.id ?? null,
      campanhaNome: campanhaAtiva?.nome ?? null,
      metaVotos: campanhaAtiva?.metaVotos ?? null,
      diasParaEleicao,
      pctExecucao,
      tarefasAtrasadas,
      tarefasTotal,
      proximoMarcoTitulo,
      proximoMarcoDias,
      totalGasto,
      orcamentoTotal,
      pctOrcamento,
      contratosVencendo,
      pecasPendentes,
      mencoesAbertas,
      liderancasA,
    };
  }

  async getMeusItens(tenantId: string, userId: string) {
    const hoje = new Date();

    const [demandas, eventos] = await Promise.all([
      this.prisma.demanda.findMany({
        where: {
          tenantId,
          atribuidoA: userId,
          status: { in: ['aberta', 'triagem', 'encaminhada', 'em_andamento'] },
        },
        select: {
          id: true,
          titulo: true,
          status: true,
          prioridade: true,
          dataPrazo: true,
          protocolo: true,
        },
        orderBy: { dataPrazo: 'asc' },
        take: 5,
      }),
      this.prisma.agenda.findMany({
        where: {
          tenantId,
          responsavelId: userId,
          dataInicio: { gte: hoje },
        },
        select: {
          id: true,
          titulo: true,
          dataInicio: true,
          tipo: true,
          local: true,
        },
        orderBy: { dataInicio: 'asc' },
        take: 5,
      }),
    ]);

    return {
      demandas,
      eventos,
    };
  }

  async globalSearch(tenantId: string, q: string) {
    if (!q || q.length < 2) return [];

    // Simple search across a few main entities, as the Prisma view 'v_busca_global' might not be directly queryable
    const [pessoas, campanhas, demandas] = await Promise.all([
      this.prisma.pessoa.findMany({
        where: { tenantId, fullName: { contains: q, mode: 'insensitive' } },
        take: 10,
        select: { id: true, fullName: true },
      }),
      this.prisma.campanha.findMany({
        where: { tenantId, nome: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { id: true, nome: true },
      }),
      this.prisma.demanda.findMany({
        where: { tenantId, titulo: { contains: q, mode: 'insensitive' } },
        take: 10,
        select: { id: true, titulo: true, status: true },
      }),
    ]);

    const results: any[] = [];
    pessoas.forEach((p) =>
      results.push({
        tipo: 'pessoa',
        id: p.id,
        titulo: p.fullName,
        subtitulo: 'Pessoa',
        link: `/crm/pessoas/${p.id}`,
      }),
    );
    campanhas.forEach((c) =>
      results.push({
        tipo: 'campanha',
        id: c.id,
        titulo: c.nome,
        subtitulo: 'Campanha Eleitoral',
        link: `/plano/campanhas`,
      }),
    );
    demandas.forEach((d) =>
      results.push({
        tipo: 'demanda',
        id: d.id,
        titulo: d.titulo,
        subtitulo: `Status: ${d.status}`,
        link: `/campo/demandas/${d.id}`,
      }),
    );

    return results;
  }
}
