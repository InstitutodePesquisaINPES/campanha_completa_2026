import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateContatoDto,
  CreateEnderecoDto,
  CreatePapelDto,
  CreatePessoaDto,
  UpdatePessoaDto,
} from './dto/crm.dto';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- PESSOAS ----
  async count(tenantId: string) {
    return this.prisma.pessoa.count({
      where: { tenantId },
    });
  }

  async findAll(
    tenantId: string,
    search?: string,
    nivel?: string,
    tipo?: string,
  ) {
    return this.prisma.pessoa.findMany({
      where: {
        tenantId,
        AND: [
          search
            ? {
                OR: [
                  { fullName: { contains: search, mode: 'insensitive' } },
                  { cpf: { contains: search } },
                  { cnpj: { contains: search } },
                ],
              }
            : {},
          nivel && nivel !== 'all' ? { nivelRelacionamento: nivel } : {},
          tipo && tipo !== 'all' ? { tipoPessoa: tipo } : {},
        ],
      },
      include: {
        papeis: true,
        contatos: true,
        tags: { include: { tag: true } },
      },
      orderBy: { fullName: 'asc' },
      take: 500,
    });
  }

  async findOne(id: string, tenantId: string) {
    const pessoa = await this.prisma.pessoa.findFirst({
      where: { id, tenantId },
      include: {
        papeis: true,
        contatos: true,
        enderecos: true,
        tags: { include: { tag: true } },
      },
    });
    if (!pessoa) throw new NotFoundException(`Pessoa not found`);
    return pessoa;
  }

  private normalizePessoaPayload(data: CreatePessoaDto | UpdatePessoaDto) {
    const fullName = data.fullName || data.nome;

    const normalized: Record<string, unknown> = {
      fullName,
      tipoPessoa: data.tipoPessoa,
      cpf: data.cpf,
      cnpj: data.cnpj,
      razaoSocial: data.razaoSocial,
      nomeFantasia: data.nomeFantasia,
      dataNascimento: data.dataNascimento,
      genero: data.genero,
      escolaridade: data.escolaridade,
      nivelRelacionamento: data.nivelRelacionamento || data.nivelEngajamento,
      observacoes: data.observacoes,
      score: data.score ?? data.scoreTotal,
      isLideranca: data.isLideranca,
      liderancaId: data.liderancaId,
    };

    return Object.fromEntries(
      Object.entries(normalized).filter(([, value]) => value !== undefined),
    );
  }

  async create(data: CreatePessoaDto, userId: string, tenantId: string) {
    const payload = this.normalizePessoaPayload(data);
    if (!payload.fullName) {
      throw new BadRequestException('Informe o nome completo da pessoa');
    }

    const createData: Prisma.PessoaUncheckedCreateInput = {
      ...payload,
      fullName: String(payload.fullName),
      createdBy: userId,
      tenantId,
    };

    return this.prisma.pessoa.create({ data: createData });
  }

  async update(id: string, data: UpdatePessoaDto, tenantId: string) {
    await this.findOne(id, tenantId); // Asserts ownership
    return this.prisma.pessoa.update({
      where: { id },
      data: this.normalizePessoaPayload(data),
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId); // Asserts ownership
    return this.prisma.pessoa.delete({ where: { id } });
  }

  // ---- CONTATOS ----
  async getContatos(pessoaId: string, tenantId: string) {
    await this.findOne(pessoaId, tenantId);
    return this.prisma.pessoaContato.findMany({
      where: { pessoaId, tenantId },
    });
  }

  async createContato(
    pessoaId: string,
    data: CreateContatoDto,
    tenantId: string,
  ) {
    await this.findOne(pessoaId, tenantId);
    return this.prisma.pessoaContato.create({
      data: { ...data, pessoaId, tenantId },
    });
  }

  async deleteContato(id: string, tenantId: string) {
    const contato = await this.prisma.pessoaContato.findFirst({
      where: { id, tenantId },
    });
    if (!contato) throw new NotFoundException('Contato não encontrado');
    return this.prisma.pessoaContato.delete({ where: { id } });
  }

  // ---- ENDEREÇOS ----
  async getEnderecos(pessoaId: string, tenantId: string) {
    await this.findOne(pessoaId, tenantId);
    return this.prisma.pessoaEndereco.findMany({
      where: { pessoaId, tenantId },
    });
  }

  async createEndereco(
    pessoaId: string,
    data: CreateEnderecoDto,
    tenantId: string,
  ) {
    await this.findOne(pessoaId, tenantId);
    const payload = {
      pessoaId,
      tenantId,
      tipo: data.tipo,
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      cep: data.cep,
      bairroId: data.bairroId,
      municipioId: data.municipioId,
    };
    return this.prisma.pessoaEndereco.create({ data: payload });
  }

  async deleteEndereco(id: string, tenantId: string) {
    const endereco = await this.prisma.pessoaEndereco.findFirst({
      where: { id, tenantId },
    });
    if (!endereco) throw new NotFoundException('Endereço não encontrado');
    return this.prisma.pessoaEndereco.delete({ where: { id } });
  }

  // ---- PAPEIS ----
  async getPapeis(pessoaId: string, tenantId: string) {
    await this.findOne(pessoaId, tenantId);
    return this.prisma.pessoaPapel.findMany({ where: { pessoaId, tenantId } });
  }

  async createPapel(
    pessoaId: string,
    data: CreatePapelDto,
    tenantId: string,
  ) {
    await this.findOne(pessoaId, tenantId);
    return this.prisma.pessoaPapel.create({
      data: { ...data, pessoaId, tenantId },
    });
  }

  async deletePapel(id: string, tenantId: string) {
    const papel = await this.prisma.pessoaPapel.findFirst({
      where: { id, tenantId },
    });
    if (!papel) throw new NotFoundException('Papel não encontrado');
    return this.prisma.pessoaPapel.delete({ where: { id } });
  }

  // ---- HISTÓRICO E CONSENTIMENTOS ----
  private mapAuditPayload(log: any) {
    const data = (log.newData || {}) as Record<string, any>;
    return {
      id: log.id,
      ...data,
      data_contato: data.data_contato || log.createdAt,
      created_at: log.createdAt,
    };
  }

  async getHistorico(pessoaId: string, tenantId: string) {
    await this.findOne(pessoaId, tenantId);
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        tableName: 'pessoas_historico_contatos',
        recordId: pessoaId,
      },
      orderBy: { createdAt: 'desc' },
    });
    return logs.map((log) => this.mapAuditPayload(log));
  }

  async createHistorico(
    pessoaId: string,
    data: any,
    userId: string,
    tenantId: string,
  ) {
    await this.findOne(pessoaId, tenantId);
    const log = await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'create',
        tableName: 'pessoas_historico_contatos',
        recordId: pessoaId,
        newData: {
          tipo: data.tipo,
          resumo: data.resumo,
          resultado: data.resultado,
          data_contato: new Date().toISOString(),
        },
      },
    });
    return this.mapAuditPayload(log);
  }

  async getConsentimentos(pessoaId: string, tenantId: string) {
    await this.findOne(pessoaId, tenantId);
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        tableName: 'pessoas_consentimentos',
        recordId: pessoaId,
      },
      orderBy: { createdAt: 'desc' },
    });
    return logs.map((log) => this.mapAuditPayload(log));
  }

  async createConsentimento(
    pessoaId: string,
    data: any,
    userId: string,
    tenantId: string,
  ) {
    await this.findOne(pessoaId, tenantId);
    const log = await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: data.consentido ? 'consent_granted' : 'consent_revoked',
        tableName: 'pessoas_consentimentos',
        recordId: pessoaId,
        newData: {
          finalidade: data.finalidade,
          consentido: Boolean(data.consentido),
          canal_coleta: data.canal_coleta,
        },
      },
    });
    return this.mapAuditPayload(log);
  }

  // ---- TAGS ----
  async getTags(tenantId: string) {
    return this.prisma.tag.findMany({
      where: { tenantId },
      orderBy: { nome: 'asc' },
    });
  }

  async createTag(data: any, tenantId: string) {
    return this.prisma.tag.create({ data: { ...data, tenantId } });
  }

  async addPessoaTag(pessoaId: string, tagId: string, tenantId: string) {
    await this.findOne(pessoaId, tenantId);
    const tag = await this.prisma.tag.findFirst({ where: { id: tagId, tenantId } });
    if (!tag) throw new NotFoundException('Tag não encontrada');
    return this.prisma.pessoaTag.create({ data: { pessoaId, tagId, tenantId } });
  }

  async removePessoaTag(pessoaId: string, tagId: string, tenantId: string) {
    const pessoaTag = await this.prisma.pessoaTag.findFirst({
      where: { pessoaId, tagId, tenantId },
    });
    if (!pessoaTag) throw new NotFoundException('Tag da pessoa não encontrada');
    return this.prisma.pessoaTag.delete({
      where: { pessoaId_tagId: { pessoaId, tagId } },
    });
  }
}
