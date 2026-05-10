import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- CENTROS DE CUSTO ----
  async getCentrosCusto() {
    return this.prisma.centroCusto.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async createCentroCusto(data: any) {
    return this.prisma.centroCusto.create({ data });
  }

  async deleteCentroCusto(id: string) {
    return this.prisma.centroCusto.delete({ where: { id } });
  }

  // ---- DESPESAS ----
  async findAllDespesas(centroCustoId?: string) {
    return this.prisma.despesa.findMany({
      where: centroCustoId && centroCustoId !== 'all' ? { centroCustoId } : undefined,
      include: {
        centroCusto: { select: { nome: true } },
      },
      orderBy: { dataDespesa: 'desc' },
      take: 500,
    });
  }

  async createDespesa(data: any, userId: string) {
    return this.prisma.despesa.create({ 
      data: { ...data, responsavelId: userId } 
    });
  }

  async updateDespesa(id: string, data: any) {
    return this.prisma.despesa.update({
      where: { id },
      data,
    });
  }

  async deleteDespesa(id: string) {
    return this.prisma.despesa.delete({ where: { id } });
  }

  // ---- RECEITAS ----
  async findAllReceitas(centroCustoId?: string) {
    return this.prisma.receita.findMany({
      where: centroCustoId && centroCustoId !== 'all' ? { centroCustoId } : undefined,
      include: {
        centroCusto: { select: { nome: true } },
      },
      orderBy: { dataReceita: 'desc' },
      take: 500,
    });
  }

  async createReceita(data: any) {
    return this.prisma.receita.create({ data });
  }

  async deleteReceita(id: string) {
    return this.prisma.receita.delete({ where: { id } });
  }
}
