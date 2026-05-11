import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsappProvider {
  private readonly logger = new Logger(WhatsappProvider.name);
  private isEnabled = false;
  private apiUrl: string;
  private apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('WHATSAPP_API_URL') ?? '';
    this.apiKey = this.configService.get<string>('WHATSAPP_API_KEY') ?? '';

    if (this.apiUrl && this.apiKey) {
      this.isEnabled = true;
      this.logger.log('Provedor de WhatsApp Ativado (Variáveis Encontradas).');
    } else {
      this.logger.warn(
        'Provedor de WhatsApp desativado: WHATSAPP_API_URL e WHATSAPP_API_KEY ausentes.',
      );
    }
  }

  async enviarMensagem(
    telefone: string,
    texto: string,
  ): Promise<{ success: boolean; providerId?: string; error?: string }> {
    if (!this.isEnabled) {
      return {
        success: false,
        error:
          'Provedor de WhatsApp não configurado. Defina WHATSAPP_API_URL e WHATSAPP_API_KEY.',
      };
    }

    try {
      const res = await fetch(`${this.apiUrl.replace(/\/$/, '')}/message/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          number: telefone.replace(/\D/g, ''),
          text: texto,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error:
            payload?.message ||
            payload?.error ||
            `WhatsApp API retornou HTTP ${res.status}`,
        };
      }

      const providerId =
        payload?.key?.id || payload?.id || payload?.messageId || undefined;
      this.logger.log(`WhatsApp enviado para ${telefone}`);
      return { success: true, providerId };
    } catch (e) {
      this.logger.error(
        `Falha no envio de WhatsApp para ${telefone}: ${e.message}`,
      );
      return { success: false, error: e.message };
    }
  }
}
