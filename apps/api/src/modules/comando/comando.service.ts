import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateReuniaoDto,
  UpdateReuniaoDto,
  CreateDeliberacaoDto,
} from './dto/comando.dto';

@Injectable()
export class ComandoService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- INDICADORES (View substituída por queries) ----
  async getIndicadoresCampanha(tenantId: string) {
    const [
      totalPessoas,
      demandasAbertas,
      demandasResolvidas,
      demandasUrgentes,
      eventosFuturos,
      campanhaAtiva,
      totalGastoAgg,
    ] = await Promise.all([
      this.prisma.pessoa.count({ where: { tenantId } }),
      this.prisma.demanda.count({
        where: { tenantId, status: { not: 'resolvida' } },
      }),
      this.prisma.demanda.count({ where: { tenantId, status: 'resolvida' } }),
      this.prisma.demanda.count({
        where: {
          tenantId,
          prioridade: 'urgente',
          status: { not: 'resolvida' },
        },
      }),
      this.prisma.agenda.count({
        where: { tenantId, dataInicio: { gte: new Date() } },
      }),
      this.prisma.campanha.findFirst({
        where: { tenantId, ativa: true },
        orderBy: { createdAt: 'desc' },
        include: { tarefas: true },
      }),
      this.prisma.despesa.aggregate({
        where: { tenantId },
        _sum: { valor: true },
      }),
    ]);

    if (!campanhaAtiva) return null;

    const hoje = new Date();
    const tarefas = campanhaAtiva.tarefas || [];
    const tarefasConcluidas = tarefas.filter((t) => !!t.dataConclusao).length;
    const tarefasAtrasadas = tarefas.filter(
      (t) => !t.dataConclusao && t.dataPrevista && t.dataPrevista < hoje,
    ).length;
    const diasRestantes = campanhaAtiva.dataEleicao
      ? Math.ceil((campanhaAtiva.dataEleicao.getTime() - hoje.getTime()) / 86400000)
      : null;

    return {
      campanha_id: campanhaAtiva.id,
      campanha_nome: campanhaAtiva.nome,
      cargo: campanhaAtiva.cargo,
      meta_votos: campanhaAtiva.metaVotos,
      data_eleicao: campanhaAtiva.dataEleicao?.toISOString() ?? null,
      dias_restantes: diasRestantes,
      total_pessoas: totalPessoas,
      demandas_abertas: demandasAbertas,
      demandas_resolvidas: demandasResolvidas,
      demandas_urgentes: demandasUrgentes,
      eventos_futuros: eventosFuturos,
      tarefas_concluidas: tarefasConcluidas,
      tarefas_total: tarefas.length,
      tarefas_atrasadas: tarefasAtrasadas,
      total_gasto: Number(totalGastoAgg._sum.valor ?? 0),
      orcamento_total: Number(campanhaAtiva.orcamentoTotal ?? 0),
    };
  }

  // ---- BURNDOWN ----
  async getBurndown(campanhaId: string, tenantId: string) {
    const tarefas = await this.prisma.campanhaTarefa.findMany({
      where: { campanhaId, tenantId, dataPrevista: { not: null } },
      orderBy: { dataPrevista: 'asc' },
      select: { dataPrevista: true, dataConclusao: true },
    });

    let totalAcumulado = 0;
    let concluidasAcumulado = 0;

    return tarefas.map((tarefa) => {
      totalAcumulado += 1;
      if (tarefa.dataConclusao) concluidasAcumulado += 1;
      return {
        data_prevista: tarefa.dataPrevista?.toISOString(),
        total_acumulado: totalAcumulado,
        concluidas_acumulado: concluidasAcumulado,
      };
    });
  }

  // ---- REUNIOES ----
  async getReunioes(tenantId: string) {
    return this.prisma.reuniao.findMany({
      where: { tenantId },
      orderBy: { dataReuniao: 'desc' },
    });
  }

  async createReuniao(data: CreateReuniaoDto, tenantId: string) {
    return this.prisma.reuniao.create({
      data: { ...data, tenantId },
    });
  }

  async updateReuniao(id: string, data: UpdateReuniaoDto, tenantId: string) {
    return this.prisma.reuniao.update({
      where: { id, tenantId },
      data,
    });
  }

  // ---- DELIBERACOES ----
  async getDeliberacoes(reuniaoId: string, tenantId: string) {
    return this.prisma.reuniaoDeliberacao.findMany({
      where: { reuniaoId, tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createDeliberacao(data: CreateDeliberacaoDto, tenantId: string) {
    return this.prisma.reuniaoDeliberacao.create({
      data: { ...data, tenantId },
    });
  }

  async toggleDeliberacao(id: string, status: string, tenantId: string) {
    return this.prisma.reuniaoDeliberacao.update({
      where: { id, tenantId },
      data: { status },
    });
  }
}
