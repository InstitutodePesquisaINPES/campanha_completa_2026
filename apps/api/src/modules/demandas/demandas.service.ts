import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DemandasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: any) {
    let whereClause: any = {};
    if (filters.status && filters.status !== 'all') whereClause.status = filters.status;
    if (filters.prioridade && filters.prioridade !== 'all') whereClause.prioridade = filters.prioridade;
    if (filters.categoria && filters.categoria !== 'all') whereClause.categoria = filters.categoria;
    if (filters.origem && filters.origem !== 'all') whereClause.origem = filters.origem;
    if (filters.municipioId) whereClause.municipioId = filters.municipioId;
    if (filters.semResponsavel === 'true') whereClause.atribuidoA = null;
    if (filters.search) {
      whereClause.OR = [
        { titulo: { contains: filters.search, mode: 'insensitive' } },
        { descricao: { contains: filters.search, mode: 'insensitive' } },
        { protocolo: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    
    // For vencidas, we need to filter after query or use a raw query if needed. 
    // Here we'll do a basic filter.
    if (filters.vencidas === 'true') {
      whereClause.dataPrazo = { lt: new Date() };
      whereClause.status = { notIn: ['resolvida', 'arquivada'] };
    }

    return this.prisma.demanda.findMany({
      where: whereClause,
      include: {
        pessoa: { select: { fullName: true } },
        creator: { select: { fullName: true } },
        atribuido: { select: { fullName: true } },
      },
      orderBy: { dataAbertura: 'desc' },
      take: 500,
    });
  }

  async getStats() {
    const demandas = await this.prisma.demanda.findMany({
      select: {
        status: true,
        prioridade: true,
        dataPrazo: true,
        dataResolucao: true,
        dataAbertura: true,
        satisfacaoCidadao: true,
      },
    });

    const now = new Date();
    const ativas = demandas.filter(d => !['resolvida', 'arquivada'].includes(d.status));
    const vencidas = ativas.filter(d => d.dataPrazo && new Date(d.dataPrazo) < now);
    const resolvidas = demandas.filter(d => d.status === 'resolvida');
    const urgentes = ativas.filter(d => d.prioridade === 'urgente');

    const tempoMedio = (() => {
      const arr = resolvidas
        .filter(d => d.dataResolucao && d.dataAbertura)
        .map(d => (new Date(d.dataResolucao!).getTime() - new Date(d.dataAbertura).getTime()) / 86400000);
      if (!arr.length) return 0;
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    })();

    const satisfacao = (() => {
      const arr = demandas.filter(d => d.satisfacaoCidadao).map(d => d.satisfacaoCidadao!);
      if (!arr.length) return 0;
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    })();

    return {
      total: demandas.length,
      ativas: ativas.length,
      vencidas: vencidas.length,
      resolvidas: resolvidas.length,
      urgentes: urgentes.length,
      tempoMedioDias: tempoMedio,
      satisfacaoMedia: satisfacao,
      taxaResolucao: demandas.length ? (resolvidas.length / demandas.length) * 100 : 0,
    };
  }

  async findOne(id: string) {
    const demanda = await this.prisma.demanda.findUnique({
      where: { id },
      include: { 
        pessoa: { select: { fullName: true } }, 
        atribuido: { select: { fullName: true } },
        encaminhamentos: true,
        anexos: true,
      },
    });
    if (!demanda) throw new NotFoundException('Demanda não encontrada');
    return demanda;
  }

  async create(data: any, userId: string) {
    return this.prisma.demanda.create({
      data: {
        ...data,
        createdBy: userId,
        protocolo: data.protocolo || `REQ-${Date.now()}`,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.demanda.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.demanda.delete({
      where: { id },
    });
  }

  // ---- ENCAMINHAMENTOS ----
  async getEncaminhamentos(demandaId: string) {
    return this.prisma.demandaEncaminhamento.findMany({
      where: { demandaId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createEncaminhamento(data: any, userId: string) {
    return this.prisma.demandaEncaminhamento.create({
      data: { ...data, deUsuarioId: userId }
    });
  }

  // ---- ANEXOS ----
  async getAnexos(demandaId: string) {
    return this.prisma.demandaAnexo.findMany({
      where: { demandaId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createAnexo(data: any) {
    return this.prisma.demandaAnexo.create({ data });
  }
}
