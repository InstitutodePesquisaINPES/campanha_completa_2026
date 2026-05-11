import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  UpdateMunicipioStrategyDto,
  CreateBairroDto,
  CreateMapaCenarioDto,
  CreateMapaSetorDto,
  UpdateMapaSetorDto,
} from './dto/territorio.dto';

const MICRORREGIAO_VC_IBGE = [
  '2933307',
  '2900801',
  '2901502',
  '2904605',
  '2905107',
  '2906857',
  '2908804',
  '2909307',
  '2909802',
  '2910008',
  '2911105',
  '2911501',
  '2913606',
  '2918803',
  '2918902',
  '2919306',
  '2920009',
  '2921906',
  '2922151',
  '2922706',
  '2924108',
  '2925006',
  '2925501',
  '2925709',
  '2926707',
  '2929206',
  '2930105',
  '2932101',
  '2932457',
  '2932903',
  '2933208',
  '2933455',
  '2933604',
];

@Injectable()
export class TerritorioService {
  constructor(private readonly prisma: PrismaService) {}
  async getEstados() {
    return this.prisma.estado.findMany({
      select: { id: true, sigla: true, nome: true },
      orderBy: { nome: 'asc' },
    });
  }

  async getStats() {
    const [estados, municipios, bairros] = await Promise.all([
      this.prisma.estado.count(),
      this.prisma.municipio.count(),
      this.prisma.bairro.count(),
    ]);
    return { estados, municipios, bairros };
  }

  async importarIbge(data: {
    uf: string;
    estado_nome: string;
    geocodigo_ibge: string;
    municipios: Array<{ nome: string; geocodigo_ibge: string }>;
  }) {
    // Upsert estado
    let estado = await this.prisma.estado.findFirst({
      where: { sigla: data.uf },
    });
    if (!estado) {
      estado = await this.prisma.estado.create({
        data: {
          sigla: data.uf,
          nome: data.estado_nome,
          geocodigoIbge: data.geocodigo_ibge,
        },
      });
    }

    // Upsert municipios
    let count = 0;
    for (const m of data.municipios) {
      await this.prisma.municipio.upsert({
        where: { geocodigoIbge: m.geocodigo_ibge },
        create: {
          nome: m.nome,
          estadoId: estado.id,
          geocodigoIbge: m.geocodigo_ibge,
        },
        update: { nome: m.nome },
      });
      count++;
    }

    return { count };
  }

  async getMunicipios(estadoId?: string, search?: string, limit?: number) {
    return this.prisma.municipio.findMany({
      select: {
        id: true,
        nome: true,
        estadoId: true,
        geocodigoIbge: true,
        populacao: true,
      },
      where: {
        ...(estadoId && { estadoId }),
        ...(search && { nome: { contains: search, mode: 'insensitive' } }),
      },
      orderBy: { nome: 'asc' },
      take: limit ?? 500,
    });
  }

  async getStrategicMunicipios(tenantId: string) {
    // Busca Estado BA
    const estado = await this.prisma.estado.findFirst({
      where: { sigla: 'BA' },
    });

    if (!estado) return [];

    const municipios = await this.prisma.municipio.findMany({
      where: { estadoId: estado.id },
      include: {
        estado: true,
        bairros: {
          select: { id: true },
        },
        enderecos: {
          where: { tenantId },
          select: { pessoaId: true },
        },
      },
      orderBy: { nome: 'asc' },
    });

    // Busca Foco Campanha
    const campanhaAtiva = await this.prisma.campanha.findFirst({
      where: { tenantId, ativa: true },
      select: { municipiosFocoIds: true },
    });

    const focoIds = new Set(campanhaAtiva?.municipiosFocoIds || []);

    return municipios.map((m) => {
      const isFocoCampanha = focoIds.has(m.id);
      const isMicrorregiaoVC =
        m.geocodigoIbge && MICRORREGIAO_VC_IBGE.includes(m.geocodigoIbge);

      return {
        id: m.id,
        nome: m.nome,
        estado_sigla: m.estado?.sigla || 'BA',
        geocodigo_ibge: m.geocodigoIbge,
        populacao: m.populacao,
        eleitorado_total: m.eleitoradoTotal,
        latitude: m.latitude,
        longitude: m.longitude,
        classificacao_estrategica: m.classificacaoEstrategica,
        prioridade_campanha: m.prioridadeCampanha,
        notas_estrategicas: m.notasEstrategicas,
        bairros_count: m.bairros.length,
        pessoas_count: new Set(m.enderecos.map((e) => e.pessoaId)).size,
        is_foco: isFocoCampanha || isMicrorregiaoVC,
      };
    });
  }

  async updateMunicipioStrategy(
    id: string,
    payload: UpdateMunicipioStrategyDto,
  ) {
    return this.prisma.municipio.update({
      where: { id },
      data: {
        classificacaoEstrategica: payload.classificacao_estrategica,
        prioridadeCampanha: payload.prioridade_campanha,
        notasEstrategicas: payload.notas_estrategicas,
      },
    });
  }

  async getBairros(municipioId: string) {
    return this.prisma.bairro.findMany({
      where: { municipioId },
      orderBy: { nome: 'asc' },
    });
  }

  async createBairro(data: CreateBairroDto) {
    return this.prisma.bairro.create({
      data: {
        nome: data.nome,
        municipioId: data.municipio_id,
        zonaEstrategica: data.zona_estrategica,
        perfilSocioeconomico: data.perfil_socioeconomico,
      },
    });
  }

  async importBairros(municipioId: string, nomes: string[]) {
    // Busca bairros existentes (case insensitive if possible, but basic matching here)
    const existentes = await this.prisma.bairro.findMany({
      where: { municipioId },
      select: { nome: true },
    });
    const setEx = new Set(existentes.map((b) => b.nome.toLowerCase()));

    const novos = Array.from(new Set(nomes))
      .filter((n) => !setEx.has(n.toLowerCase()))
      .map((nome) => ({ nome, municipioId }));

    if (novos.length === 0) return { count: 0 };

    const result = await this.prisma.bairro.createMany({
      data: novos,
      skipDuplicates: true,
    });

    return { count: result.count };
  }

  async getMapaEstrategicoBairros(tenantId: string, municipioId?: string) {
    // Simplification of the SQL View via Prisma
    const bairros = await this.prisma.bairro.findMany({
      where: {
        ...(municipioId && { municipioId }),
        municipio: { tenantId },
      },
      include: {
        municipio: true,
      },
    });

    return bairros.map((b) => ({
      bairro_id: b.id,
      bairro_nome: b.nome,
      classificacao: b.zonaEstrategica,
      municipio_id: b.municipioId,
      municipio_nome: b.municipio?.nome || '',
      eleitores_cadastrados: 0, // In a real scenario, sum from pessoas_enderecos
      apoiadores: 0,
      meta_votos_total: 0,
      demandas_abertas: 0,
      demandas_resolvidas: 0,
    }));
  }

  // Mapas Cenários
  async getMapaCenarios(tenantId: string, campanhaId?: string) {
    return this.prisma.mapaCenario.findMany({
      where: {
        tenantId,
        ...(campanhaId && { OR: [{ campanhaId }, { campanhaId: null }] }),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createMapaCenario(
    tenantId: string,
    userId: string,
    data: CreateMapaCenarioDto,
  ) {
    return this.prisma.mapaCenario.create({
      data: { ...data, tenantId, createdBy: userId },
    });
  }

  async removeMapaCenario(tenantId: string, id: string) {
    return this.prisma.mapaCenario.delete({
      where: { id, tenantId },
    });
  }

  // Mapas Setores
  async getMapaSetores(tenantId: string, campanhaId?: string) {
    return this.prisma.mapaSetor.findMany({
      where: {
        tenantId,
        ...(campanhaId && { OR: [{ campanhaId }, { campanhaId: null }] }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMapaSetor(
    tenantId: string,
    userId: string,
    data: CreateMapaSetorDto,
  ) {
    return this.prisma.mapaSetor.create({
      data: {
        ...data,
        tenantId,
        createdBy: userId,
        tipo: 'setor',
        cor: data.cor || '#3B82F6',
      },
    });
  }

  async updateMapaSetor(
    tenantId: string,
    id: string,
    data: UpdateMapaSetorDto,
  ) {
    return this.prisma.mapaSetor.update({
      where: { id, tenantId },
      data,
    });
  }

  async removeMapaSetor(tenantId: string, id: string) {
    return this.prisma.mapaSetor.delete({
      where: { id, tenantId },
    });
  }
}
