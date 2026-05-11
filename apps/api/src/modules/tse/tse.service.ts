import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

@Injectable()
export class TseService {
  private readonly logger = new Logger(TseService.name);
  private readonly uploadDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'tse');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // ─── CSV ARQUIVOS (FILA DE UPLOADS) ──────────────────────

  async getArquivos(tenantId: string) {
    return this.prisma.tseCsvArquivo.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async saveArquivoMeta(tenantId: string, userId: string | null, body: any) {
    return this.prisma.tseCsvArquivo.create({
      data: {
        nomeOriginal: body.nome_original || 'unknown.csv',
        tipo: body.tipo || 'eleitorado',
        ano: body.ano || 2024,
        uf: body.uf || 'BR',
        storagePath: body.storage_path || '',
        tabelaDestino: body.tabela_destino || '',
        tamanhoBytes: body.tamanho_bytes ? BigInt(body.tamanho_bytes) : null,
        status: 'aguardando',
        createdBy: userId,
        tenantId,
      },
    });
  }

  async updateArquivo(tenantId: string, id: string, patch: any) {
    const arquivo = await this.prisma.tseCsvArquivo.findFirst({
      where: { id, tenantId },
    });
    if (!arquivo) throw new NotFoundException('Arquivo não encontrado');

    const updateData: any = {};
    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.error_msg !== undefined) updateData.errorMsg = patch.error_msg;
    if (patch.linhas_processadas !== undefined)
      updateData.linhasProcessadas = patch.linhas_processadas;
    if (patch.progress_pct !== undefined)
      updateData.progressPct = patch.progress_pct;
    if (patch.byte_cursor !== undefined)
      updateData.byteCursor = BigInt(patch.byte_cursor);
    if (patch.attempts !== undefined) updateData.attempts = patch.attempts;
    if (patch.started_at !== undefined)
      updateData.startedAt = patch.started_at
        ? new Date(patch.started_at)
        : null;
    if (patch.finished_at !== undefined)
      updateData.finishedAt = patch.finished_at
        ? new Date(patch.finished_at)
        : null;

    return this.prisma.tseCsvArquivo.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteArquivo(tenantId: string, id: string) {
    const arquivo = await this.prisma.tseCsvArquivo.findFirst({
      where: { id, tenantId },
    });
    if (!arquivo) throw new NotFoundException('Arquivo não encontrado');

    // Delete physical file if exists
    if (arquivo.storagePath) {
      const fullPath = path.join(process.cwd(), arquivo.storagePath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          this.logger.warn(`Failed to delete file ${fullPath}: ${e}`);
        }
      }
    }

    await this.prisma.tseCsvArquivo.delete({ where: { id } });
    return { success: true };
  }

  // ─── UPLOAD CHUNK ─────────────────────────────────────────

  async handleUploadChunk(file: Express.Multer.File, body: any) {
    if (!file) {
      throw new BadRequestException('File is missing');
    }
    return {
      success: true,
      path: file.path,
      size: file.size,
    };
  }

  // ─── IMPORT JOBS ──────────────────────────────────────────

  async getJobs(tenantId: string) {
    return this.prisma.tseImportJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getJobLogs(tenantId: string, jobId: string) {
    return this.prisma.tseImportLog.findMany({
      where: { tenantId, jobId },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
  }

  async enqueueJob(tenantId: string, body: any) {
    const { uf, anos = [], tipos = [] } = body;
    const jobs: any[] = [];
    for (const ano of anos) {
      for (const tipo of tipos) {
        const job = await this.prisma.tseImportJob.create({
          data: {
            tipo,
            uf: uf || 'BR',
            ano,
            status: 'queued',
            tenantId,
          },
        });
        jobs.push(job);
      }
    }
    return { success: true, enqueued: jobs.length };
  }

  async cancelJob(tenantId: string, id: string) {
    const job = await this.prisma.tseImportJob.findFirst({
      where: { id, tenantId },
    });
    if (!job) throw new NotFoundException('Job não encontrado');

    await this.prisma.tseImportJob.update({
      where: { id },
      data: {
        status: 'cancelled',
        finishedAt: new Date(),
      },
    });
    return { success: true };
  }

  async runWorker(tenantId: string) {
    // 1. Check if there is already a file processing
    const isProcessing = await this.prisma.tseCsvArquivo.findFirst({
      where: { tenantId, status: 'processando' }
    });
    if (isProcessing) {
      return { success: false, msg: 'Já existe um arquivo sendo processado no momento.', arquivo: isProcessing };
    }

    // 2. Find the oldest 'aguardando' file
    const target = await this.prisma.tseCsvArquivo.findFirst({
      where: { tenantId, status: 'aguardando' },
      orderBy: { createdAt: 'asc' }
    });

    if (!target) {
      return { success: false, picked: 0, msg: 'Nenhum arquivo aguardando na fila.' };
    }

    // 3. Mark as processing
    await this.prisma.tseCsvArquivo.update({
      where: { id: target.id },
      data: { status: 'processando', startedAt: new Date(), errorMsg: null }
    });

    // 4. Resolve absolute path
    const absolutePath = path.join(process.cwd(), target.storagePath);
    const scriptPath = path.join(process.cwd(), 'import-master.js');

    // 5. Spawn background worker
    // node import-master.js <arquivo_id> <tenant_id> <tipo> <caminho_absoluto>
    const child = spawn('node', [scriptPath, target.id, target.tenantId, target.tipo, absolutePath], {
      detached: true,
      stdio: 'ignore' // We ignore stdio to let it run completely detached in background
    });

    child.unref();

    this.logger.log(`Worker import-master.js disparado para arquivo ${target.id} (${target.tipo})`);

    return { success: true, picked: 1, arquivo: target, msg: 'Worker iniciado em background' };
  }

  // ─── STATISTICS ───────────────────────────────────────────

  async getStats(tenantId: string) {
    const [eleitorado, candidatos, resultados, locais] = await Promise.all([
      this.prisma.tseEleitoradoPerfil.count({ where: { tenantId } }),
      this.prisma.tseCandidato.count({ where: { tenantId } }),
      this.prisma.tseResultadoSecao.count({ where: { tenantId } }),
      this.prisma.tseLocalVotacao.count({ where: { tenantId } }),
    ]);

    return {
      eleitorado,
      candidatos,
      resultados,
      locais,
      prestacao_contas: 0, // future
    };
  }

  // ─── RESUMO POR MUNICIPIO ─────────────────────────────────

  async getResumoMunicipios(tenantId: string, ano: number, uf: string) {
    // Aggregate voters per municipality from tse_eleitorado_perfil
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT
        ep.municipio,
        COALESCE(SUM(ep.quantidade_eleitores), 0)::int AS eleitores,
        COUNT(ep.id)::int AS registros_perfil,
        0 AS candidatos_perfil
      FROM tse_eleitorado_perfil ep
      WHERE ep.tenant_id = ${tenantId}::uuid
        AND ep.ano = ${ano}
        AND ep.uf = ${uf}
        AND ep.municipio IS NOT NULL
      GROUP BY ep.municipio
      ORDER BY ep.municipio
    `;

    return rows;
  }

  // ─── API DATA RETRIEVAL ───────────────────────────────────

  async getQuocienteEleitoral(tenantId: string, uf: string, ano: number, codMunicipioTse: string, cargo: string) {
    const eleitos = await this.prisma.tseCandidato.count({
      where: { tenantId, uf, ano, codMunicipioTse, cargo, eleito: true }
    });

    const votosValidosRes = await this.prisma.tseResultadoSecao.aggregate({
      where: {
        tenantId, uf, ano, codMunicipioTse, cargo,
        numeroVotavel: { notIn: ['95', '96', '97'] } // 95=Branco, 96=Nulo, 97=Anulado
      },
      _sum: { votos: true }
    });

    const votosValidos = votosValidosRes._sum.votos || 0;
    const vagas = eleitos > 0 ? eleitos : 1; 
    const quocienteEleitoral = Math.floor(votosValidos / vagas);

    return {
      uf,
      ano,
      codMunicipioTse,
      cargo,
      votosValidos,
      vagas: eleitos,
      quocienteEleitoral
    };
  }

  async getCandidatos(tenantId: string, filters: any) {
    const { uf, ano, cargo, cod_municipio_tse, busca, eleito, partido } = filters;
    
    const where: any = { tenantId };
    if (uf) where.uf = uf;
    if (ano) where.ano = parseInt(ano, 10);
    if (cargo) where.cargo = cargo;
    if (cod_municipio_tse) where.codMunicipioTse = cod_municipio_tse;
    if (eleito !== undefined) where.eleito = eleito;
    if (partido) where.partidoSigla = partido;

    if (busca) {
      where.OR = [
        { nomeUrna: { contains: busca, mode: 'insensitive' } },
        { nomeCompleto: { contains: busca, mode: 'insensitive' } },
        { numeroUrna: { contains: busca } }
      ];
    }

    return this.prisma.tseCandidato.findMany({
      where,
      orderBy: { nomeUrna: 'asc' },
      take: 100,
    });
  }

  async getCandidatoMatch(tenantId: string, body: any) {
    const { nomeCompleto, cpf } = body;
    if (!nomeCompleto && !cpf) return null;

    const where: any = { tenantId };
    if (cpf) {
      where.cpf = cpf.replace(/\D/g, '');
    } else if (nomeCompleto) {
      where.nomeCompleto = { equals: nomeCompleto, mode: 'insensitive' };
    }

    return this.prisma.tseCandidato.findFirst({ where });
  }

  async getPessoaMatch(tenantId: string, pessoaId: string) {
    const pessoa = await this.prisma.pessoa.findFirst({
      where: { id: pessoaId, tenantId }
    });

    if (!pessoa) return [];

    const where: any = { tenantId };
    if (pessoa.cpf) {
      where.cpf = pessoa.cpf.replace(/\D/g, '');
    } else if (pessoa.fullName) {
      where.nomeCompleto = { equals: pessoa.fullName, mode: 'insensitive' };
    } else {
      return [];
    }

    return this.prisma.tseCandidato.findMany({
      where,
      orderBy: { ano: 'desc' }
    });
  }

  async getCandidatoHistorico(tenantId: string, cpf?: string, nomeCompleto?: string) {
    if (!nomeCompleto && !cpf) return [];

    const where: any = { tenantId };
    if (cpf) {
      where.cpf = cpf.replace(/\D/g, '');
    } else if (nomeCompleto) {
      where.nomeCompleto = { equals: nomeCompleto, mode: 'insensitive' };
    }

    return this.prisma.tseCandidato.findMany({ 
      where,
      orderBy: { ano: 'desc' }
    });
  }

  async getEleitoradoPerfil(tenantId: string, uf: string, ano: number, municipio?: string) {
    const whereCondition = `ep.tenant_id = '${tenantId}'::uuid AND ep.uf = '${uf}' AND ep.ano = ${ano} ${municipio ? `AND ep.municipio = '${municipio}'` : ''}`;
    
    // As we can't do dynamic raw queries safely without Prisma.$queryRawUnsafe or careful mapping, we use raw.
    // However, Prisma group by is easier for generic profiling.
    
    const whereObj: any = { tenantId, uf, ano };
    if (municipio) whereObj.municipio = municipio;

    const totalRes = await this.prisma.tseEleitoradoPerfil.aggregate({
      where: whereObj,
      _sum: { quantidadeEleitores: true }
    });
    
    const total = totalRes._sum.quantidadeEleitores || 0;

    const generoRaw = await this.prisma.tseEleitoradoPerfil.groupBy({
      by: ['genero'],
      where: whereObj,
      _sum: { quantidadeEleitores: true }
    });

    const faixaEtariaRaw = await this.prisma.tseEleitoradoPerfil.groupBy({
      by: ['faixaEtaria'],
      where: whereObj,
      _sum: { quantidadeEleitores: true }
    });

    const grauInstrucaoRaw = await this.prisma.tseEleitoradoPerfil.groupBy({
      by: ['grauInstrucao'],
      where: whereObj,
      _sum: { quantidadeEleitores: true }
    });

    const corRacaRaw = await this.prisma.tseEleitoradoPerfil.groupBy({
      by: ['corRaca'],
      where: whereObj,
      _sum: { quantidadeEleitores: true }
    });

    const estadoCivilRaw = await this.prisma.tseEleitoradoPerfil.groupBy({
      by: ['estadoCivil'],
      where: whereObj,
      _sum: { quantidadeEleitores: true }
    });

    const formatData = (raw: any[], key: string) => raw.map(r => ({ name: r[key] || 'Não Informado', value: r._sum.quantidadeEleitores || 0 }));

    return {
      total,
      genero: formatData(generoRaw, 'genero'),
      faixa_etaria: formatData(faixaEtariaRaw, 'faixaEtaria'),
      grau_instrucao: formatData(grauInstrucaoRaw, 'grauInstrucao'),
      cor_raca: formatData(corRacaRaw, 'corRaca'),
      estado_civil: formatData(estadoCivilRaw, 'estadoCivil')
    };
  }

  async getEleitoradoSecaoPerfil(tenantId: string, uf: string, ano: number, codMunicipioTse: string, zona: number, secao?: number) {
    const whereObj: any = { tenantId, uf, ano, codMunicipioTse, zona };
    if (secao) {
      whereObj.secao = secao;
    }

    const totalRes = await this.prisma.tseEleitoradoSecao.aggregate({
      where: whereObj,
      _sum: { quantidadeEleitores: true }
    });
    
    const total = totalRes._sum.quantidadeEleitores || 0;

    const generoRaw = await this.prisma.tseEleitoradoSecao.groupBy({ by: ['genero'], where: whereObj, _sum: { quantidadeEleitores: true } });
    const faixaEtariaRaw = await this.prisma.tseEleitoradoSecao.groupBy({ by: ['faixaEtaria'], where: whereObj, _sum: { quantidadeEleitores: true } });
    const grauInstrucaoRaw = await this.prisma.tseEleitoradoSecao.groupBy({ by: ['grauInstrucao'], where: whereObj, _sum: { quantidadeEleitores: true } });
    const corRacaRaw = await this.prisma.tseEleitoradoSecao.groupBy({ by: ['corRaca'], where: whereObj, _sum: { quantidadeEleitores: true } });
    const estadoCivilRaw = await this.prisma.tseEleitoradoSecao.groupBy({ by: ['estadoCivil'], where: whereObj, _sum: { quantidadeEleitores: true } });

    const formatData = (raw: any[], key: string) => raw.map(r => ({ name: r[key] || 'Não Informado', value: r._sum.quantidadeEleitores || 0 }));

    return {
      total,
      genero: formatData(generoRaw, 'genero'),
      faixa_etaria: formatData(faixaEtariaRaw, 'faixaEtaria'),
      grau_instrucao: formatData(grauInstrucaoRaw, 'grauInstrucao'),
      cor_raca: formatData(corRacaRaw, 'corRaca'),
      estado_civil: formatData(estadoCivilRaw, 'estadoCivil')
    };
  }

  async getVotosSecao(tenantId: string, filters: any) {
    const { uf, ano, cargo, cod_municipio_tse, numero_votavel } = filters;
    const where: any = { tenantId, codMunicipioTse: cod_municipio_tse };
    
    if (uf) where.uf = uf;
    if (ano) where.ano = parseInt(ano, 10);
    if (cargo) where.cargo = cargo;
    if (numero_votavel) where.numeroVotavel = numero_votavel;

    return this.prisma.tseResultadoSecao.findMany({
      where,
      orderBy: [{ zona: 'asc' }, { secao: 'asc' }],
      take: 1000,
    });
  }

  async getLocaisVotacao(tenantId: string, uf: string, ano: number, codMunicipioTse?: string) {
    const where: any = { tenantId, uf, ano };
    if (codMunicipioTse) where.codMunicipioTse = codMunicipioTse;

    return this.prisma.tseLocalVotacao.findMany({
      where,
      orderBy: { nomeLocal: 'asc' },
      take: 500,
    });
  }

  async getComparativo(tenantId: string, uf: string, municipio?: string, cargo?: string) {
    // This is a complex aggregation. For simplicity, we just aggregate total votes by party or candidate.
    // If cargo is specified, we aggregate top 10 voted candidates in that municipality.
    if (!cargo || !municipio) return [];
    
    const rows = await this.prisma.$queryRawUnsafe(`
      SELECT 
        numero_votavel AS numero, 
        MAX(partido_sigla) AS partido,
        SUM(votos)::int AS total_votos
      FROM tse_resultados_secao
      WHERE tenant_id = $1::uuid AND uf = $2 AND cod_municipio_tse = $3 AND cargo = $4
      GROUP BY numero_votavel
      ORDER BY total_votos DESC
      LIMIT 10
    `, tenantId, uf, municipio, cargo);
    
    return rows;
  }

  async getOrigemVotosLocal(tenantId: string, filters: any) {
    const { uf, ano, cargo, cod_municipio_tse, numero_votavel } = filters;
    if (!cod_municipio_tse || !numero_votavel) return [];

    // Join tse_resultados_secao with tse_locais_votacao on zona/secao
    const rows = await this.prisma.$queryRawUnsafe(`
      SELECT 
        l.nome_local, l.bairro, l.latitude, l.longitude,
        SUM(r.votos)::int AS total_votos
      FROM tse_resultados_secao r
      JOIN tse_locais_votacao l ON r.tenant_id = l.tenant_id AND r.cod_municipio_tse = l.cod_municipio_tse AND r.zona = l.zona
      WHERE r.tenant_id = $1::uuid 
        AND r.uf = $2 
        AND r.ano = $3 
        AND r.cod_municipio_tse = $4 
        AND r.numero_votavel = $5
      GROUP BY l.nome_local, l.bairro, l.latitude, l.longitude
      ORDER BY total_votos DESC
      LIMIT 100
    `, tenantId, uf, parseInt(ano, 10), cod_municipio_tse, numero_votavel);

    return rows;
  }

  // ─── INGEST CHUNK (the core anti-duplication engine) ──────

  async ingestChunk(tenantId: string, tabela: string, registros: any[]) {
    if (!registros || registros.length === 0) {
      return { inserted: 0 };
    }

    let inserted = 0;

    try {
      switch (tabela) {
        case 'tse_eleitorado_perfil':
          inserted = await this.upsertEleitoradoPerfil(tenantId, registros);
          break;
        case 'tse_candidatos':
          inserted = await this.upsertCandidatos(tenantId, registros);
          break;
        case 'tse_resultados_secao':
          inserted = await this.upsertResultados(tenantId, registros);
          break;
        case 'tse_locais_votacao':
          inserted = await this.upsertLocais(tenantId, registros);
          break;
        case 'tse_votacao_candidato_perfil':
          // Falls back to eleitorado_perfil for now
          inserted = await this.upsertEleitoradoPerfil(tenantId, registros);
          break;
        case 'tse_eleitorado':
          // Legacy format — map to perfil
          inserted = await this.upsertEleitoradoPerfil(tenantId, registros);
          break;
        default:
          throw new BadRequestException(`Tabela desconhecida: ${tabela}`);
      }
    } catch (e: any) {
      this.logger.error(`Ingest error for ${tabela}: ${e.message}`);
      throw e;
    }

    return { inserted };
  }

  // ─── UPSERT METHODS (anti-duplication via ON CONFLICT) ────

  private async upsertEleitoradoPerfil(
    tenantId: string,
    registros: any[],
  ): Promise<number> {
    let count = 0;

    // Process in smaller sub-batches to avoid query size limits
    const batchSize = 50;
    for (let i = 0; i < registros.length; i += batchSize) {
      const batch = registros.slice(i, i + batchSize);

      await this.prisma.$transaction(
        batch.map((r) =>
          this.prisma.tseEleitoradoPerfil.upsert({
            where: {
              uq_eleitorado_perfil: {
                tenantId,
                ano: r.ano ?? 2024,
                uf: r.uf ?? 'BR',
                municipio: r.municipio ?? null,
                corRaca: r.cor_raca ?? null,
                faixaEtaria: r.faixa_etaria ?? null,
                genero: r.genero ?? null,
                grauInstrucao: r.grau_instrucao ?? null,
              },
            },
            update: {
              quantidadeEleitores: r.quantidade_eleitores ?? 0,
              regiao: r.regiao ?? undefined,
              estadoCivil: r.estado_civil ?? undefined,
            },
            create: {
              tenantId,
              ano: r.ano ?? 2024,
              uf: r.uf ?? 'BR',
              municipio: r.municipio ?? null,
              regiao: r.regiao ?? null,
              corRaca: r.cor_raca ?? null,
              estadoCivil: r.estado_civil ?? null,
              faixaEtaria: r.faixa_etaria ?? null,
              genero: r.genero ?? null,
              grauInstrucao: r.grau_instrucao ?? null,
              quantidadeEleitores: r.quantidade_eleitores ?? 0,
            },
          }),
        ),
      );

      count += batch.length;
    }

    return count;
  }

  private async upsertCandidatos(
    tenantId: string,
    registros: any[],
  ): Promise<number> {
    let count = 0;
    const batchSize = 50;

    for (let i = 0; i < registros.length; i += batchSize) {
      const batch = registros.slice(i, i + batchSize);

      await this.prisma.$transaction(
        batch.map((r) =>
          this.prisma.tseCandidato.upsert({
            where: {
              uq_candidato: {
                tenantId,
                ano: r.ano ?? 2024,
                uf: r.uf ?? 'BR',
                turno: r.turno ?? 1,
                cargo: r.cargo ?? '',
                numeroUrna: r.numero_urna ?? '',
                codMunicipioTse: r.cod_municipio_tse ?? '',
              },
            },
            update: {
              nomeUrna: r.nome_urna ?? undefined,
              nomeCompleto: r.nome_completo ?? undefined,
              cpf: r.cpf ?? undefined,
              partidoSigla: r.partido_sigla ?? undefined,
              partidoNumero: r.partido_numero ?? undefined,
              coligacao: r.coligacao ?? undefined,
              genero: r.genero ?? undefined,
              ocupacao: r.ocupacao ?? undefined,
              situacaoCandidatura: r.situacao_candidatura ?? undefined,
              situacaoEleicao: r.situacao_eleicao ?? undefined,
              eleito: r.eleito ?? false,
            },
            create: {
              tenantId,
              ano: r.ano ?? 2024,
              uf: r.uf ?? 'BR',
              turno: r.turno ?? 1,
              cargo: r.cargo ?? '',
              numeroUrna: r.numero_urna ?? '',
              nomeUrna: r.nome_urna ?? null,
              nomeCompleto: r.nome_completo ?? null,
              cpf: r.cpf ?? null,
              partidoSigla: r.partido_sigla ?? null,
              partidoNumero: r.partido_numero ?? null,
              coligacao: r.coligacao ?? null,
              genero: r.genero ?? null,
              ocupacao: r.ocupacao ?? null,
              situacaoCandidatura: r.situacao_candidatura ?? null,
              situacaoEleicao: r.situacao_eleicao ?? null,
              eleito: r.eleito ?? false,
              codMunicipioTse: r.cod_municipio_tse ?? null,
            },
          }),
        ),
      );

      count += batch.length;
    }

    return count;
  }

  private async upsertResultados(
    tenantId: string,
    registros: any[],
  ): Promise<number> {
    let count = 0;
    const batchSize = 50;

    for (let i = 0; i < registros.length; i += batchSize) {
      const batch = registros.slice(i, i + batchSize);

      await this.prisma.$transaction(
        batch.map((r) =>
          this.prisma.tseResultadoSecao.upsert({
            where: {
              uq_resultado_secao: {
                tenantId,
                ano: r.ano ?? 2024,
                uf: r.uf ?? 'BR',
                turno: r.turno ?? 1,
                codMunicipioTse: r.cod_municipio_tse ?? '',
                zona: r.zona ?? 0,
                secao: r.secao ?? 0,
                numeroVotavel: r.numero_votavel ?? '',
                cargo: r.cargo ?? '',
              },
            },
            update: {
              votos: r.votos ?? 0,
              partidoSigla: r.partido_sigla ?? undefined,
            },
            create: {
              tenantId,
              ano: r.ano ?? 2024,
              uf: r.uf ?? 'BR',
              turno: r.turno ?? 1,
              cargo: r.cargo ?? '',
              codMunicipioTse: r.cod_municipio_tse ?? '',
              zona: r.zona ?? 0,
              secao: r.secao ?? 0,
              numeroVotavel: r.numero_votavel ?? '',
              partidoSigla: r.partido_sigla ?? null,
              votos: r.votos ?? 0,
            },
          }),
        ),
      );

      count += batch.length;
    }

    return count;
  }

  private async upsertLocais(
    tenantId: string,
    registros: any[],
  ): Promise<number> {
    let count = 0;
    const batchSize = 50;

    for (let i = 0; i < registros.length; i += batchSize) {
      const batch = registros.slice(i, i + batchSize);

      await this.prisma.$transaction(
        batch.map((r) =>
          this.prisma.tseLocalVotacao.upsert({
            where: {
              uq_local_votacao: {
                tenantId,
                ano: r.ano ?? 2024,
                uf: r.uf ?? 'BR',
                codMunicipioTse: r.cod_municipio_tse ?? '',
                codigoLocal: r.codigo_local ?? '',
                zona: r.zona ?? 0,
              },
            },
            update: {
              nomeLocal: r.nome_local ?? undefined,
              endereco: r.endereco ?? undefined,
              bairro: r.bairro ?? undefined,
              cep: r.cep ?? undefined,
              latitude: r.latitude ?? undefined,
              longitude: r.longitude ?? undefined,
            },
            create: {
              tenantId,
              ano: r.ano ?? 2024,
              uf: r.uf ?? 'BR',
              codMunicipioTse: r.cod_municipio_tse ?? '',
              codigoLocal: r.codigo_local ?? '',
              nomeLocal: r.nome_local ?? null,
              endereco: r.endereco ?? null,
              bairro: r.bairro ?? null,
              cep: r.cep ?? null,
              zona: r.zona ?? 0,
              latitude: r.latitude ?? null,
              longitude: r.longitude ?? null,
            },
          }),
        ),
      );

      count += batch.length;
    }

    return count;
  }
}
