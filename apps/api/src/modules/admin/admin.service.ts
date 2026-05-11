import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTagDto } from './dto/admin.dto';
import { AppRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuditLogs(
    tenantId: string,
    action: string,
    table: string,
    page: number,
  ) {
    const pageSize = 50;
    const skip = page * pageSize;

    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        ...(action !== 'all' && { action }),
        ...(table && { tableName: { contains: table, mode: 'insensitive' } }),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });
  }

  async getUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      include: {
        roles: true,
      },
    });
  }

  async getTags(tenantId: string) {
    return this.prisma.tag.findMany({
      where: { tenantId },
      orderBy: { nome: 'asc' },
    });
  }

  async createTag(tenantId: string, data: CreateTagDto) {
    return this.prisma.tag.create({
      data: { ...data, tenantId },
    });
  }

  async removeTag(tenantId: string, id: string) {
    return this.prisma.tag.delete({
      where: { id, tenantId },
    });
  }

  async addRole(tenantId: string, userId: string, role: AppRole) {
    return this.prisma.userRole.create({
      data: { userId, role, tenantId },
    });
  }

  async removeRole(tenantId: string, userId: string, role: AppRole) {
    return this.prisma.userRole.deleteMany({
      where: { userId, role, tenantId },
    });
  }

  async createUser(tenantId: string, data: any) {
    if (!data.email || !data.password || !data.full_name) {
      throw new BadRequestException('Informe nome, e-mail e senha temporária');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        fullName: data.full_name,
        phone: data.phone,
        passwordHash,
        tenantId,
      },
    });

    if (data.role) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          role: data.role as AppRole,
          tenantId,
        },
      });
    }

    return user;
  }

  // --- Centros de Custo ---
  async getCentrosCusto(tenantId: string) {
    return this.prisma.centroCusto.findMany({
      where: { tenantId },
      orderBy: { nome: 'asc' },
    });
  }

  async createCentroCusto(tenantId: string, data: any) {
    return this.prisma.centroCusto.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        orcamentoPrevisto: data.orcamento_previsto,
        tenantId,
      },
    });
  }

  async removeCentroCusto(tenantId: string, id: string) {
    return this.prisma.centroCusto.delete({
      where: { id, tenantId },
    });
  }

  // --- Dashboard & System Health ---
  async getSystemHealth(tenantId: string) {
    // Implement realistic checks matching the frontend expectations
    const [
      demandasAtrasadas,
      pessoasSemContato,
      demandasAbertas,
      usuariosTotal,
      campanhasAtivas,
      auditHoje,
    ] = await Promise.all([
      this.prisma.demanda.count({
        where: { tenantId, status: { not: 'resolvida' } },
      }),
      0, // Complex query for people without recent contacts would go here
      this.prisma.demanda.count({
        where: { tenantId, status: { not: 'resolvida' } },
      }),
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.campanha.count({ where: { tenantId, ativa: true } }),
      this.prisma.auditLog.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return {
      demandasAtrasadas,
      pessoasSemContato,
      demandasAbertas,
      usuariosTotal,
      campanhasAtivas,
      auditHoje,
    };
  }

  async getStatsCounts(tenantId: string) {
    const [
      pessoas,
      demandas,
      agenda,
      municipios,
      bairros,
      materiais,
      despesas,
      receitas,
      campanhas,
      audit_logs,
    ] = await Promise.all([
      this.prisma.pessoa.count({ where: { tenantId } }),
      this.prisma.demanda.count({ where: { tenantId } }),
      this.prisma.agenda.count({ where: { tenantId } }),
      this.prisma.municipio.count(),
      this.prisma.bairro.count(),
      this.prisma.material.count({ where: { tenantId } }),
      this.prisma.despesa.count({ where: { tenantId } }),
      this.prisma.receita.count({ where: { tenantId } }),
      this.prisma.campanha.count({ where: { tenantId } }),
      this.prisma.auditLog.count({ where: { tenantId } }),
    ]);

    return {
      pessoas,
      demandas,
      agenda,
      municipios,
      bairros,
      materiais,
      despesas,
      receitas,
      campanhas,
      audit_logs,
    };
  }

  async getStats30d(tenantId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 29);

    const days = Array.from({ length: 30 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });

    return Promise.all(
      days.map(async (dia) => {
        const fim = new Date(dia);
        fim.setDate(dia.getDate() + 1);

        const [pessoas, demandas, eventos] = await Promise.all([
          this.prisma.pessoa.count({
            where: { tenantId, createdAt: { gte: dia, lt: fim } },
          }),
          this.prisma.demanda.count({
            where: { tenantId, createdAt: { gte: dia, lt: fim } },
          }),
          this.prisma.agenda.count({
            where: { tenantId, createdAt: { gte: dia, lt: fim } },
          }),
        ]);

        return { dia: dia.toISOString(), pessoas, demandas, eventos };
      }),
    );
  }
}
