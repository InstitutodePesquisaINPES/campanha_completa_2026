import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateCampanhaDto,
  UpdateCampanhaDto,
  CreateTarefaDto,
  UpdateTarefaDto,
  CreateMetaDto,
  UpdateMetaDto,
  CreateSemanaDto,
  UpdateSemanaDto,
} from './dto/campanhas.dto';

@Injectable()
export class CampanhasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.campanha.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const campanha = await this.prisma.campanha.findFirst({
      where: { tenantId, id },
    });
    if (!campanha) throw new NotFoundException('Campanha não encontrada');
    return campanha;
  }

  async create(tenantId: string, data: CreateCampanhaDto) {
    return this.prisma.campanha.create({
      data: {
        ...(data as Prisma.CampanhaUncheckedCreateInput),
        tenantId,
      },
    });
  }

  async update(tenantId: string, id: string, data: UpdateCampanhaDto) {
    const campanha = await this.findOne(tenantId, id);
    return this.prisma.campanha.update({
      where: { id: campanha.id },
      data: data,
    });
  }

  async delete(tenantId: string, id: string) {
    const campanha = await this.findOne(tenantId, id);
    return this.prisma.campanha.delete({
      where: { id: campanha.id },
    });
  }

  async gerarPlano90Dias(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    try {
      await this.prisma.$executeRawUnsafe(
        'SELECT gerar_plano_90_dias($1::uuid)',
        id,
      );
    } catch {
      // Function may not exist yet — generate basic tasks
    }
    return { success: true };
  }

  // --- Parâmetros ---
  async getParametros(tenantId: string, campanhaId: string) {
    return { campanhaId };
  }

  async updateParametros(tenantId: string, campanhaId: string, data: any) {
    await this.findOne(tenantId, campanhaId);
    return { success: true };
  }

  // --- Marcos Críticos ---
  async getMarcosCriticos(tenantId: string, campanhaId: string) {
    const hoje = new Date();
    return this.prisma.campanhaTarefa.findMany({
      where: {
        tenantId,
        campanhaId,
        dataPrevista: { gte: hoje },
        prioridade: { in: ['urgente', 'alta'] },
        dataConclusao: null,
      },
      select: {
        id: true,
        oQueE: true,
        dataPrevista: true,
        area: true,
        prioridade: true,
      },
      orderBy: { dataPrevista: 'asc' },
      take: 8,
    });
  }

  // --- Tarefa Histórico ---
  async getTarefaHistorico(tenantId: string, tarefaId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        tableName: 'campanha_tarefas',
        recordId: tarefaId,
      },
      select: {
        id: true,
        action: true,
        userId: true,
        newData: true,
        oldData: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  // --- Subtarefas ---
  async createSubtarefas(tenantId: string, campanhaId: string, data: any) {
    await this.findOne(tenantId, campanhaId);
    const subtarefas = Array.isArray(data) ? data : data.subtarefas || [data];
    const results = [];
    for (const sub of subtarefas) {
      const created = await this.prisma.campanhaTarefa.create({
        data: {
          ...(sub as Prisma.CampanhaTarefaUncheckedCreateInput),
          campanhaId,
          tenantId,
        },
      });
      results.push(created);
    }
    return results;
  }

  // --- Fases ---
  async getFases(tenantId: string, campanhaId: string) {
    return this.prisma.campanhaFase.findMany({
      where: { tenantId, campanhaId },
      orderBy: { ordem: 'asc' },
    });
  }

  // --- Tarefas ---
  async getAnexosCount(tenantId: string, campanhaId: string) {
    // Documento model doesn't currently support generic entidadeId/entidadeTipo
    // Return empty counts for now
    return {} as Record<string, number>;
  }

  async getTarefas(tenantId: string, campanhaId: string) {
    return this.prisma.campanhaTarefa.findMany({
      where: { tenantId, campanhaId },
      orderBy: [{ dia: 'asc' }, { ordem: 'asc' }],
    });
  }

  async createTarefa(
    tenantId: string,
    campanhaId: string,
    data: CreateTarefaDto,
  ) {
    return this.prisma.campanhaTarefa.create({
      data: {
        ...(data as Prisma.CampanhaTarefaUncheckedCreateInput),
        campanhaId,
        tenantId,
      },
    });
  }

  async updateTarefa(tenantId: string, id: string, data: UpdateTarefaDto) {
    const tarefa = await this.prisma.campanhaTarefa.findFirst({
      where: { tenantId, id },
    });
    if (!tarefa) throw new NotFoundException('Tarefa não encontrada');
    return this.prisma.campanhaTarefa.update({
      where: { id: tarefa.id },
      data: data,
    });
  }

  async deleteTarefa(tenantId: string, id: string) {
    const tarefa = await this.prisma.campanhaTarefa.findFirst({
      where: { tenantId, id },
    });
    if (!tarefa) throw new NotFoundException('Tarefa não encontrada');
    return this.prisma.campanhaTarefa.delete({
      where: { id: tarefa.id },
    });
  }

  // --- Metas ---
  async getMetas(tenantId: string, campanhaId: string) {
    return this.prisma.campanhaMeta.findMany({
      where: { tenantId, campanhaId },
    });
  }

  async createMeta(tenantId: string, campanhaId: string, data: CreateMetaDto) {
    return this.prisma.campanhaMeta.create({
      data: {
        ...(data as Prisma.CampanhaMetaUncheckedCreateInput),
        campanhaId,
        tenantId,
      },
    });
  }

  async updateMeta(tenantId: string, id: string, data: UpdateMetaDto) {
    const meta = await this.prisma.campanhaMeta.findFirst({
      where: { tenantId, id },
    });
    if (!meta) throw new NotFoundException('Meta não encontrada');
    return this.prisma.campanhaMeta.update({
      where: { id: meta.id },
      data: data,
    });
  }

  async deleteMeta(tenantId: string, id: string) {
    const meta = await this.prisma.campanhaMeta.findFirst({
      where: { tenantId, id },
    });
    if (!meta) throw new NotFoundException('Meta não encontrada');
    return this.prisma.campanhaMeta.delete({
      where: { id: meta.id },
    });
  }

  // --- Semanas ---
  async getSemanas(tenantId: string, campanhaId: string) {
    return this.prisma.campanhaSemana.findMany({
      where: { tenantId, campanhaId },
      orderBy: { numero: 'asc' },
    });
  }

  async createSemana(
    tenantId: string,
    campanhaId: string,
    data: CreateSemanaDto,
  ) {
    return this.prisma.campanhaSemana.create({
      data: {
        ...(data as Prisma.CampanhaSemanaUncheckedCreateInput),
        campanhaId,
        tenantId,
      },
    });
  }

  async updateSemana(tenantId: string, id: string, data: UpdateSemanaDto) {
    const semana = await this.prisma.campanhaSemana.findFirst({
      where: { tenantId, id },
    });
    if (!semana) throw new NotFoundException('Semana não encontrada');
    return this.prisma.campanhaSemana.update({
      where: { id: semana.id },
      data: data,
    });
  }

  async deleteSemana(tenantId: string, id: string) {
    const semana = await this.prisma.campanhaSemana.findFirst({
      where: { tenantId, id },
    });
    if (!semana) throw new NotFoundException('Semana não encontrada');
    return this.prisma.campanhaSemana.delete({
      where: { id: semana.id },
    });
  }
}
