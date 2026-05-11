import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SegmentacaoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera um público alvo (audiência) cruzando múltiplos filtros relacionais.
   * Exemplo de payload `filtros`:
   * {
   *   "scoreMin": 50,
   *   "liderancaId": "uuid",
   *   "bairroIds": ["uuid1", "uuid2"],
   *   "tags": ["Apoiador", "Sindicalista"],
   *   "temDemandasAbertas": true
   * }
   */
  async gerarAudiencia(filtros: any, tenantId: string) {
    const where: Prisma.PessoaWhereInput = { tenantId };

    if (filtros.scoreMin) {
      where.score = { gte: filtros.scoreMin };
    }
    if (filtros.scoreMax) {
      where.score = {
        ...(where.score as object),
        lte: filtros.scoreMax,
      };
    }
    if (filtros.liderancaId) {
      where.liderancaId = filtros.liderancaId;
    }
    if (filtros.bairroIds && filtros.bairroIds.length > 0) {
      where.enderecos = {
        some: {
          bairroId: { in: filtros.bairroIds },
        },
      };
    }
    if (filtros.tags && filtros.tags.length > 0) {
      where.tags = {
        some: {
          tag: { nome: { in: filtros.tags } },
        },
      };
    }
    if (filtros.temDemandasAbertas) {
      where.demandas = {
        some: {
          status: { not: 'resolvida' },
        },
      };
    }

    const publico = await this.prisma.pessoa.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        score: true,
        contatos: {
          where: { principal: true },
          select: { valor: true, tipo: true },
        },
      },
    });

    return {
      total: publico.length,
      pessoas: publico,
    };
  }
}
