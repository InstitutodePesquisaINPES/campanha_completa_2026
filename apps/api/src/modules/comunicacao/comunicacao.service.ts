import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WhatsappProvider } from './providers/whatsapp.provider';
import {
  CreatePautaDto,
  UpdatePautaDto,
  CreatePecaDto,
  UpdatePecaDto,
  CreateMencaoDto,
  UpdateMencaoDto,
} from './dto/comunicacao.dto';

@Injectable()
export class ComunicacaoService {
  private readonly logger = new Logger(ComunicacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappProvider: WhatsappProvider,
  ) {}

  private async enviarMensagemParaPessoa(
    pessoaId: string,
    tipo: string,
    mensagem: string,
    tenantId: string,
    campanhaId?: string,
  ) {
    const log = await this.prisma.comunicacaoLog.create({
      data: {
        pessoaId,
        campanhaId,
        tipo,
        mensagem,
        status: 'processing',
        tenantId,
      },
    });

    const contato = await this.prisma.pessoaContato.findFirst({
      where: {
        pessoaId,
        tenantId,
        tipo: { in: tipo === 'whatsapp' ? ['whatsapp', 'celular', 'telefone'] : [tipo] },
      },
      orderBy: [{ principal: 'desc' }, { createdAt: 'desc' }],
    });

    if (!contato) {
      return this.prisma.comunicacaoLog.update({
        where: { id: log.id },
        data: {
          status: 'failed',
          errorMsg: 'Nenhum contato compatível cadastrado.',
        },
      });
    }

    const resultado =
      tipo === 'whatsapp'
        ? await this.whatsappProvider.enviarMensagem(contato.valor, mensagem)
        : { success: false, error: 'Provider não implementado' };

    return this.prisma.comunicacaoLog.update({
      where: { id: log.id },
      data: {
        status: resultado.success ? 'sent' : 'failed',
        providerId: resultado.providerId,
        errorMsg: resultado.error,
      },
    });
  }

  async enviarEmMassa(campanhaId: string, tenantId: string) {
    const campanha = await this.prisma.comunicacaoCampanha.findFirst({
      where: { id: campanhaId, tenantId },
    });

    if (!campanha)
      throw new Error('Campanha não encontrada ou não pertence a este tenant.');

    // Atualiza status para processando
    await this.prisma.comunicacaoCampanha.update({
      where: { id: campanhaId },
      data: { status: 'processing' },
    });

    const filtros = (campanha.filtros || {}) as Record<string, any>;
    const pessoas = await this.prisma.pessoa.findMany({
      where: {
        tenantId,
        ...(filtros.nivelRelacionamento
          ? { nivelRelacionamento: filtros.nivelRelacionamento }
          : {}),
        ...(Array.isArray(filtros.bairroIds) && filtros.bairroIds.length
          ? { enderecos: { some: { bairroId: { in: filtros.bairroIds } } } }
          : {}),
        ...(typeof filtros.scoreMin === 'number'
          ? { score: { gte: filtros.scoreMin } }
          : {}),
      },
      select: { id: true },
    });

    let sent = 0;
    let failed = 0;
    for (const pessoa of pessoas) {
      const log = await this.enviarMensagemParaPessoa(
        pessoa.id,
        campanha.tipo,
        campanha.mensagem,
        tenantId,
        campanhaId,
      );
      if (log.status === 'sent') sent += 1;
      else failed += 1;
    }

    await this.prisma.comunicacaoCampanha.update({
      where: { id: campanhaId },
      data: { status: failed > 0 ? 'completed_with_errors' : 'completed' },
    });

    this.logger.log(
      `Campanha ${campanhaId}: ${sent} enviados, ${failed} falhas`,
    );

    return { success: failed === 0, total: pessoas.length, sent, failed };
  }

  async disparoIndividual(
    pessoaId: string,
    mensagem: string,
    tipo = 'whatsapp',
    tenantId: string,
  ) {
    // Assert person belongs to tenant
    const pessoa = await this.prisma.pessoa.findFirst({
      where: { id: pessoaId, tenantId },
    });
    if (!pessoa) throw new Error('Pessoa não encontrada neste tenant.');

    return this.enviarMensagemParaPessoa(pessoaId, tipo, mensagem, tenantId);
  }

  // --- Pautas ---
  async getPautas(tenantId: string) {
    return this.prisma.comunicacaoPauta.findMany({
      where: { tenantId },
      include: { pecas: true },
    });
  }

  async createPauta(tenantId: string, data: CreatePautaDto) {
    return this.prisma.comunicacaoPauta.create({ data: { ...data, tenantId } });
  }

  async updatePauta(tenantId: string, id: string, data: UpdatePautaDto) {
    return this.prisma.comunicacaoPauta.update({
      where: { id, tenantId },
      data,
    });
  }

  async deletePauta(tenantId: string, id: string) {
    return this.prisma.comunicacaoPauta.delete({ where: { id, tenantId } });
  }

  // --- Peças ---
  async getPecas(tenantId: string) {
    return this.prisma.comunicacaoPeca.findMany({ where: { tenantId } });
  }

  async createPeca(
    tenantId: string,
    data: CreatePecaDto & { createdBy: string },
  ) {
    return this.prisma.comunicacaoPeca.create({ data: { ...data, tenantId } });
  }

  async updatePeca(tenantId: string, id: string, data: UpdatePecaDto) {
    return this.prisma.comunicacaoPeca.update({
      where: { id, tenantId },
      data,
    });
  }

  async deletePeca(tenantId: string, id: string) {
    return this.prisma.comunicacaoPeca.delete({ where: { id, tenantId } });
  }

  // --- Menções ---
  async getMencoes(tenantId: string) {
    return this.prisma.comunicacaoMencao.findMany({ where: { tenantId } });
  }

  async createMencao(tenantId: string, data: CreateMencaoDto) {
    return this.prisma.comunicacaoMencao.create({
      data: { ...data, tenantId },
    });
  }

  async updateMencao(tenantId: string, id: string, data: UpdateMencaoDto) {
    return this.prisma.comunicacaoMencao.update({
      where: { id, tenantId },
      data,
    });
  }

  async deleteMencao(tenantId: string, id: string) {
    return this.prisma.comunicacaoMencao.delete({ where: { id, tenantId } });
  }
}
