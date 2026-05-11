import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { WhatsappProvider } from './providers/whatsapp.provider';
import { PrismaService } from '../../common/prisma/prisma.service';

@Processor('comunicacao-queue')
export class ComunicacaoProcessor extends WorkerHost {
  private readonly logger = new Logger(ComunicacaoProcessor.name);

  constructor(
    private readonly whatsappProvider: WhatsappProvider,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processando Job ${job.id} do tipo ${job.name}`);

    const { logId, campanhaId, pessoaId, tipo, mensagem, tenantId } = job.data;

    let targetLogId = logId;

    // Se for campanha em massa, precisamos criar o Log agora para cada pessoa
    if (campanhaId && !targetLogId) {
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
      targetLogId = log.id;
    }

    // Buscando telefone (vamos assumir que a PessoaContato principal seja o Celular)
    const contato = await this.prisma.pessoaContato.findFirst({
      where: {
        pessoaId,
        tenantId,
        tipo: { in: tipo === 'whatsapp' ? ['whatsapp', 'celular', 'telefone'] : [tipo] },
      },
      orderBy: [{ principal: 'desc' }, { createdAt: 'desc' }],
    });

    if (!contato) {
      await this.prisma.comunicacaoLog.update({
        where: { id: targetLogId },
        data: {
          status: 'failed',
          errorMsg: 'Nenhum telefone principal cadastrado.',
        },
      });
      return;
    }

    let resultado;
    if (tipo === 'whatsapp') {
      resultado = await this.whatsappProvider.enviarMensagem(
        contato.valor,
        mensagem,
      );
    } else {
      // SMS / Email providers
      resultado = { success: false, error: 'Provider não implementado' };
    }

    // Atualiza o Log com o status real do envio
    await this.prisma.comunicacaoLog.update({
      where: { id: targetLogId },
      data: {
        status: resultado.success ? 'sent' : 'failed',
        providerId: resultado.providerId,
        errorMsg: resultado.error,
      },
    });

    this.logger.debug(`Job ${job.id} finalizado. Status: ${resultado.success}`);
  }
}
