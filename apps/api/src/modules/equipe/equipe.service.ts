import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEquipeUserDto, UpdateEquipeUserDto } from './dto/equipe.dto';
import * as bcrypt from 'bcryptjs';
import { AppRole } from '@prisma/client';

const ROLE_WEIGHT: Record<AppRole, number> = {
  candidato: 100,
  admin: 90,
  coord_geral: 80,
  coord_financeiro: 70,
  coord_juridico: 70,
  coord_comunicacao: 70,
  coord_mobilizacao: 70,
  lideranca_regional: 50,
  lideranca_local: 40,
  cabo_eleitoral: 20,
  operador_crm: 20,
  analista_dados: 20,
  coordenador: 0,
  lideranca: 0,
  operador: 0,
  visualizador: 0,
};

@Injectable()
export class EquipeService {
  constructor(private readonly prisma: PrismaService) {}

  private async getHighestRoleWeight(userId: string): Promise<number> {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: true },
    });
    if (!roles.length) return 0;
    return Math.max(...roles.map((r) => ROLE_WEIGHT[r.role] || 0));
  }

  async findAll(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      include: {
        roles: { select: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      active: u.active,
      createdAt: u.createdAt,
      roles: u.roles.map((r) => r.role),
    }));
  }

  async create(tenantId: string, creatorId: string, data: CreateEquipeUserDto) {
    // Verificar hierarquia (criador não pode criar alguém de patente superior)
    const creatorWeight = await this.getHighestRoleWeight(creatorId);
    const targetWeight = ROLE_WEIGHT[data.role];

    if (targetWeight > creatorWeight) {
      throw new ForbiddenException(
        'Você não tem patente suficiente para criar um usuário deste nível.',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ForbiddenException('Este email já está em uso na plataforma.');
    }

    // Senha padrão gerada (poderia enviar por email em prod)
    const temporaryPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        cpf: data.cpf,
        tenantId,
        roles: {
          create: {
            role: data.role,
            tenantId,
          },
        },
      },
      include: {
        roles: true,
      },
    });

    // Registrar na Auditoria
    await this.prisma.auditLog.create({
      data: {
        userId: creatorId,
        action: 'CREATE_USER',
        tableName: 'users',
        recordId: user.id,
        newData: { email: user.email, role: data.role },
        tenantId,
      },
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      temporaryPassword,
      role: data.role,
    };
  }

  async update(tenantId: string, creatorId: string, id: string, data: UpdateEquipeUserDto) {
    const userToUpdate = await this.prisma.user.findFirst({
      where: { id, tenantId },
      include: { roles: true },
    });

    if (!userToUpdate) throw new NotFoundException('Usuário não encontrado.');

    // Verificar hierarquia para alteração
    const creatorWeight = await this.getHighestRoleWeight(creatorId);
    const targetWeight = await this.getHighestRoleWeight(id);

    // Não pode alterar alguém de nível superior
    if (targetWeight > creatorWeight && creatorWeight < 90) {
      throw new ForbiddenException('Você não tem permissão para alterar este usuário.');
    }

    // Se estiver mudando o role, não pode setar para superior ao próprio
    if (data.role && ROLE_WEIGHT[data.role] > creatorWeight) {
      throw new ForbiddenException('Você não pode promover alguém a uma patente superior à sua.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        active: data.active,
        phone: data.phone,
        cpf: data.cpf,
      },
    });

    if (data.role) {
      // Remover roles antigas e criar nova
      await this.prisma.userRole.deleteMany({
        where: { userId: id, tenantId },
      });
      await this.prisma.userRole.create({
        data: { userId: id, role: data.role, tenantId },
      });
    }

    // Registrar na Auditoria
    await this.prisma.auditLog.create({
      data: {
        userId: creatorId,
        action: 'UPDATE_USER',
        tableName: 'users',
        recordId: updatedUser.id,
        newData: data as any,
        tenantId,
      },
    });

    return updatedUser;
  }

  async getLogs(tenantId: string, userId?: string) {
    const filter = { tenantId };
    if (userId) {
      Object.assign(filter, { userId });
    }

    return this.prisma.auditLog.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        tenant: { select: { name: true } },
      },
    });
  }
}
