import { Module } from '@nestjs/common';
import { ComunicacaoController } from './comunicacao.controller';
import { ComunicacaoService } from './comunicacao.service';
import { WhatsappProvider } from './providers/whatsapp.provider';

@Module({
  imports: [],
  controllers: [ComunicacaoController],
  providers: [ComunicacaoService, WhatsappProvider],
  exports: [ComunicacaoService],
})
export class ComunicacaoModule {}
