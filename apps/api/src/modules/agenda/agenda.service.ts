import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- AGENDA ----
  async findAll(month?: string) {
    let whereClause = {};
    if (month) {
      const year = parseInt(month.split('-')[0]);
      const mon = parseInt(month.split('-')[1]);
      const startDate = new Date(year, mon - 1, 1);
      const endDate = new Date(year, mon, 0, 23, 59, 59);
      whereClause = {
        dataInicio: {
          gte: startDate,
          lte: endDate,
        }
      };
    }
    
    return this.prisma.agenda.findMany({
      where: whereClause,
      include: {
        creator: { select: { fullName: true } },
        responsavel: { select: { fullName: true } },
      },
      orderBy: { dataInicio: 'asc' },
      take: 500,
    });
  }

  async findOne(id: string) {
    const evento = await this.prisma.agenda.findUnique({
      where: { id },
      include: { 
        participantes: { include: { pessoa: { select: { fullName: true } } } }, 
        responsavel: { select: { fullName: true } },
        checkins: true,
        followups: true,
      },
    });
    if (!evento) throw new NotFoundException('Evento não encontrado');
    return evento;
  }

  async create(data: any, userId: string) {
    return this.prisma.agenda.create({
      data: {
        ...data,
        createdBy: userId,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.agenda.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.agenda.delete({
      where: { id },
    });
  }

  // ---- PARTICIPANTES ----
  async getParticipantes(agendaId: string) {
    return this.prisma.agendaParticipante.findMany({
      where: { agendaId },
      include: { pessoa: { select: { fullName: true } } },
      orderBy: { createdAt: 'asc' }
    });
  }

  async createParticipante(data: any) {
    return this.prisma.agendaParticipante.create({ data });
  }

  async updateParticipante(id: string, data: any) {
    return this.prisma.agendaParticipante.update({ where: { id }, data });
  }

  async deleteParticipante(id: string) {
    return this.prisma.agendaParticipante.delete({ where: { id } });
  }

  // ---- CHECKINS ----
  async getCheckins(agendaId: string) {
    return this.prisma.agendaCheckin.findMany({
      where: { agendaId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async createCheckin(data: any, userId: string) {
    return this.prisma.agendaCheckin.create({
      data: { ...data, usuarioId: userId }
    });
  }

  // ---- FOLLOWUPS ----
  async getFollowups(agendaId: string) {
    return this.prisma.agendaFollowup.findMany({
      where: { agendaId },
      orderBy: { prazo: 'asc' }
    });
  }

  async createFollowup(data: any) {
    return this.prisma.agendaFollowup.create({ data });
  }

  async updateFollowup(id: string, data: any) {
    return this.prisma.agendaFollowup.update({ where: { id }, data });
  }
}
