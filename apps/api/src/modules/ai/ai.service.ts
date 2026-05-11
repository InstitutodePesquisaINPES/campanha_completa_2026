import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  private exposeProvider(provider: any) {
    if (!provider) return provider;
    return {
      ...provider,
      apiKey: undefined,
      base_url: provider.baseUrl,
      secret_name: provider.apiKey,
      descricao: null,
      prioridade: 100,
      headers_extra: {},
    };
  }

  private exposeModel(model: any) {
    if (!model) return model;
    return {
      ...model,
      provedor_id: model.provedorId,
      modelo_id: model.modeloId,
      ai_provedores: model.provedor ? this.exposeProvider(model.provedor) : null,
      contexto_tokens: null,
      max_output_tokens: null,
      custo_input_por_1m: model.custoInput ?? 0,
      custo_output_por_1m: model.custoOutput ?? 0,
      suporta_vision: false,
      suporta_tools: false,
      suporta_reasoning: false,
      ativo: model.status === 'ativo',
    };
  }

  private resolveApiKey(provider: any) {
    const stored = provider.apiKey || '';
    return process.env[stored] || stored;
  }

  private normalizeProvider(data: any) {
    return {
      nome: data.nome,
      tipo: data.tipo,
      status: data.status || (data.ativo === false ? 'inativo' : 'ativo'),
      baseUrl: data.baseUrl || data.base_url || data.apiUrl,
      apiKey: data.apiKey || data.secret_name,
    };
  }

  private normalizeModel(data: any) {
    return {
      provedorId: data.provedorId || data.provedor_id,
      nome: data.nome,
      modeloId: data.modeloId || data.modelo_id || data.identificador,
      status: data.status || (data.ativo === false ? 'inativo' : 'ativo'),
      capacidades: data.capacidades,
      custoInput: data.custoInput ?? data.custo_input_por_1m,
      custoOutput: data.custoOutput ?? data.custo_output_por_1m,
    };
  }

  private normalizeCopilot(data: any) {
    return {
      nome: data.nome,
      descricao: data.descricao,
      systemPrompt:
        data.systemPrompt ||
        data.system_prompt ||
        data.promptSistema ||
        'Responda com base nos dados reais disponíveis no sistema.',
      modeloId: data.modeloId || data.modelo_id,
      provedorId: data.provedorId || data.provedor_id,
      status: data.status || (data.ativo === false ? 'inativo' : 'ativo'),
      parametros: {
        temperatura: data.temperatura,
        maxTokens: data.maxTokens,
        categoria: data.categoria,
        cor: data.cor,
      },
      funcoesAcesso: data.funcoesAcesso || [],
    };
  }

  // Providers
  async getProviders(tenantId: string) {
    const providers = await this.prisma.aiProvedor.findMany({ where: { tenantId } });
    return providers.map((provider) => this.exposeProvider(provider));
  }
  async createProvider(tenantId: string, data: any) {
    const normalized = this.normalizeProvider(data);
    if (!normalized.nome || !normalized.tipo || !normalized.baseUrl || !normalized.apiKey) {
      throw new BadRequestException('Informe nome, tipo, base URL e secret/env da API');
    }
    const provider = await this.prisma.aiProvedor.create({
      data: { ...normalized, tenantId },
    });
    return this.exposeProvider(provider);
  }
  async updateProvider(tenantId: string, id: string, data: any) {
    const provider = await this.prisma.aiProvedor.update({
      where: { id, tenantId },
      data: this.normalizeProvider(data),
    });
    return this.exposeProvider(provider);
  }
  async deleteProvider(tenantId: string, id: string) {
    return this.prisma.aiProvedor.delete({ where: { id, tenantId } });
  }

  // Models
  async getModels(tenantId: string) {
    const models = await this.prisma.aiModelo.findMany({
      where: { tenantId },
      include: { provedor: true },
    });
    return models.map((model) => this.exposeModel(model));
  }
  async createModel(tenantId: string, data: any) {
    const normalized = this.normalizeModel(data);
    if (!normalized.provedorId || !normalized.nome || !normalized.modeloId) {
      throw new BadRequestException('Informe provedor, nome e ID do modelo');
    }
    const model = await this.prisma.aiModelo.create({
      data: { ...normalized, tenantId },
      include: { provedor: true },
    });
    return this.exposeModel(model);
  }
  async updateModel(tenantId: string, id: string, data: any) {
    const model = await this.prisma.aiModelo.update({
      where: { id, tenantId },
      data: this.normalizeModel(data),
      include: { provedor: true },
    });
    return this.exposeModel(model);
  }
  async deleteModel(tenantId: string, id: string) {
    return this.prisma.aiModelo.delete({ where: { id, tenantId } });
  }

  // Copilots
  async getCopilots(tenantId: string) {
    return this.prisma.aiCopilot.findMany({
      where: { tenantId },
      include: { provedor: true, modelo: true },
    });
  }
  async createCopilot(tenantId: string, data: any) {
    const normalized = this.normalizeCopilot(data);
    if (!normalized.modeloId || !normalized.provedorId) {
      throw new BadRequestException('Informe modelo e provedor do copilot');
    }
    return this.prisma.aiCopilot.create({ data: { ...normalized, tenantId } });
  }
  async updateCopilot(tenantId: string, id: string, data: any) {
    return this.prisma.aiCopilot.update({
      where: { id, tenantId },
      data: this.normalizeCopilot(data),
    });
  }
  async deleteCopilot(tenantId: string, id: string) {
    return this.prisma.aiCopilot.delete({ where: { id, tenantId } });
  }

  // Chat
  async chat(tenantId: string, userId: string, payload: any) {
    const copilot = payload.copilot_id
      ? await this.prisma.aiCopilot.findFirst({
          where: { id: payload.copilot_id, tenantId, status: 'ativo' },
          include: { modelo: true, provedor: true },
        })
      : null;

    const model: any = copilot?.modelo || (payload.modelo_id
      ? await this.prisma.aiModelo.findFirst({
          where: { id: payload.modelo_id, tenantId, status: 'ativo' },
          include: { provedor: true },
        })
      : null);

    const provider = copilot?.provedor || model?.provedor;
    if (!model || !provider) {
      throw new NotFoundException('Modelo/copilot de IA ativo não encontrado');
    }

    const apiKey = this.resolveApiKey(provider);
    if (!apiKey) {
      throw new ServiceUnavailableException('Chave real do provedor de IA não configurada');
    }

    const started = Date.now();
    const messages = [
      ...(copilot ? [{ role: 'system', content: copilot.systemPrompt }] : []),
      ...(payload.messages || []),
    ];

    const response = await fetch(
      `${(provider.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model.modeloId,
          messages,
          temperature: (copilot?.parametros as any)?.temperatura ?? 0.2,
          max_tokens: (copilot?.parametros as any)?.maxTokens,
        }),
      },
    );

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ServiceUnavailableException(
        result?.error?.message || result?.message || `Provedor IA retornou HTTP ${response.status}`,
      );
    }

    const content = result?.choices?.[0]?.message?.content || '';
    const tokensInput = Number(result?.usage?.prompt_tokens || 0);
    const tokensOutput = Number(result?.usage?.completion_tokens || 0);
    const custoEstimado =
      (tokensInput / 1_000_000) * Number(model.custoInput || 0) +
      (tokensOutput / 1_000_000) * Number(model.custoOutput || 0);
    const latenciaMs = Date.now() - started;

    await this.prisma.aiUsoLog.create({
      data: {
        tenantId,
        userId,
        acao: 'chat',
        copilotId: copilot?.id,
        modeloId: model.id,
        provedorId: provider.id,
        tokensInput,
        tokensOutput,
        custoEstimado,
        latenciaMs,
      },
    });

    return {
      content,
      tokens: { input: tokensInput, output: tokensOutput },
      custo_estimado: custoEstimado,
      latencia_ms: latenciaMs,
      modelo: model.nome,
      provedor: provider.nome,
    };
  }

  async testProvider(tenantId: string, id: string) {
    const provider = await this.prisma.aiProvedor.findFirst({
      where: { id, tenantId },
    });
    if (!provider) throw new NotFoundException('Provedor não encontrado');
    const apiKey = this.resolveApiKey(provider);
    if (!apiKey) return { ok: false, error: 'Secret/env da API sem valor configurado' };

    const res = await fetch(`${(provider.baseUrl || '').replace(/\/$/, '')}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    }).catch((error) => ({ ok: false, status: 0, json: async () => ({ error: error.message }) }) as any);

    if (!res.ok) {
      await this.prisma.aiProvedor.update({
        where: { id },
        data: { status: 'erro' },
      });
      return { ok: false, error: `HTTP ${res.status}` };
    }

    await this.prisma.aiProvedor.update({
      where: { id },
      data: { status: 'ativo' },
    });
    return { ok: true };
  }

  async getUsageLog(tenantId: string) {
    const logs = await this.prisma.aiUsoLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { provedor: true, modelo: true, copilot: true },
    });

    return logs.map((log) => ({
      ...log,
      created_at: log.createdAt,
      tokens_input: log.tokensInput,
      tokens_output: log.tokensOutput,
      custo_estimado: log.custoEstimado,
      latencia_ms: log.latenciaMs,
      sucesso: true,
      ai_provedores: log.provedor ? this.exposeProvider(log.provedor) : null,
      ai_modelos: log.modelo ? this.exposeModel(log.modelo) : null,
      ai_copilots: log.copilot,
    }));
  }
}
