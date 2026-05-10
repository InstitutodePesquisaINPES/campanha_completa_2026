import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class StrategyService {
  private readonly logger = new Logger(StrategyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createCampanha(data: any, userId: string) {
    return this.prisma.campanhaEstrategia.create({
      data: {
        ...data,
        createdBy: userId,
      },
    });
  }

  async getCampanhas() {
    // Retorna a hierarquia (Apenas Campanhas Master com suas filhas)
    return this.prisma.campanhaEstrategia.findMany({
      where: { parentCampanhaId: null },
      include: {
        eixos: true,
        subCampanhas: {
          include: { eixos: true, parcerias: true }
        },
        parcerias: true,
      },
    });
  }

  async createParceria(campanhaId: string, data: any) {
    return this.prisma.campanhaParceria.create({
      data: {
        ...data,
        campanhaId,
      },
    });
  }

  async createEixo(campanhaId: string, data: any) {
    return this.prisma.eixoEstrategico.create({
      data: {
        ...data,
        campanhaId,
      },
    });
  }

  async createPlanoAcao(eixoId: string, data: any) {
    return this.prisma.planoAcao.create({
      data: {
        ...data,
        eixoId,
      },
    });
  }

  async getCronogramaPlanoAcao(eixoId: string) {
    return this.prisma.planoAcao.findMany({
      where: { eixoId },
      include: {
        responsavel: { select: { fullName: true } },
        dependentes: { select: { id: true, titulo: true } },
        dependeDe: { select: { id: true, titulo: true } },
      },
      orderBy: { dataInicio: 'asc' },
    });
  }

  /**
   * War Room Agregação
   * Cruza Plano de Ação com Financeiro e CRM
   */
  async getWarRoomStats(campanhaId: string) {
    // Busca eixos com orçamentos de planos vs despesas
    const eixos = await this.prisma.eixoEstrategico.findMany({
      where: { campanhaId },
      include: {
        planosAcao: {
          include: {
            despesasVinculadas: true,
            agendasVinculadas: true,
          }
        },
        _count: {
          select: { demandasVinculadas: true }
        }
      }
    });

    return eixos.map(eixo => {
      let orcamentoPlanejado = 0;
      let orcamentoGasto = 0;
      let planosConcluidos = 0;
      let agendasExecutadas = 0;

      eixo.planosAcao.forEach(plano => {
        orcamentoPlanejado += plano.orcamentoPrevisto || 0;
        if (plano.status === 'done') planosConcluidos++;
        
        plano.despesasVinculadas.forEach(d => {
          orcamentoGasto += d.valor;
        });

        agendasExecutadas += plano.agendasVinculadas.filter(a => a.status === 'realizado').length;
      });

      return {
        id: eixo.id,
        nome: eixo.nome,
        demandasCRMAbertas: eixo._count.demandasVinculadas,
        progressoPlanos: eixo.planosAcao.length > 0 ? (planosConcluidos / eixo.planosAcao.length) * 100 : 0,
        orcamentoPlanejado,
        orcamentoRealizado: orcamentoGasto,
        eventosCampanha: agendasExecutadas,
      };
      };
    });
  }

  // --- UPDATE E DELETE ---
  
  async updateCampanha(id: string, data: any) {
    return this.prisma.campanhaEstrategia.update({ where: { id }, data });
  }

  async deleteCampanha(id: string) {
    return this.prisma.campanhaEstrategia.delete({ where: { id } });
  }

  async updateEixo(id: string, data: any) {
    return this.prisma.eixoEstrategico.update({ where: { id }, data });
  }

  async deleteEixo(id: string) {
    return this.prisma.eixoEstrategico.delete({ where: { id } });
  }

  async updatePlanoAcao(id: string, data: any) {
    return this.prisma.planoAcao.update({ where: { id }, data });
  }

  async deletePlanoAcao(id: string) {
    return this.prisma.planoAcao.delete({ where: { id } });
  }

  async deleteParceria(id: string) {
    return this.prisma.campanhaParceria.delete({ where: { id } });
  }
}
