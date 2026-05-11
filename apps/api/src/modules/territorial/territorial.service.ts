import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TerritorialService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- ESTADOS ----
  async getEstados() {
    return this.prisma.estado.findMany({ orderBy: { nome: 'asc' } });
  }

  // ---- MUNICIPIOS ----
  async getMunicipios(estadoId?: string) {
    return this.prisma.municipio.findMany({
      where: estadoId ? { estadoId } : undefined,
      include: { estado: { select: { nome: true, sigla: true } } },
      orderBy: { nome: 'asc' },
    });
  }

  async createMunicipio(data: any) {
    return this.prisma.municipio.create({ data });
  }

  async updateMunicipio(id: string, data: any) {
    return this.prisma.municipio.update({ where: { id }, data });
  }

  async deleteMunicipio(id: string) {
    return this.prisma.municipio.delete({ where: { id } });
  }

  // ---- BAIRROS ----
  async getBairros(municipioId?: string) {
    return this.prisma.bairro.findMany({
      where: municipioId ? { municipioId } : undefined,
      include: {
        municipio: { select: { nome: true } },
        distrito: { select: { nome: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async createBairro(data: any) {
    return this.prisma.bairro.create({ data });
  }

  async updateBairro(id: string, data: any) {
    return this.prisma.bairro.update({ where: { id }, data });
  }

  async deleteBairro(id: string) {
    return this.prisma.bairro.delete({ where: { id } });
  }

  // ---- ZONAS ----
  async getZonasEleitorais(municipioId?: string) {
    return this.prisma.zonaEleitoral.findMany({
      where: municipioId ? { municipioId } : undefined,
      include: { municipio: { select: { nome: true } } },
      orderBy: { numeroZona: 'asc' },
    });
  }

  async createZona(data: any) {
    return this.prisma.zonaEleitoral.create({ data });
  }

  async deleteZona(id: string) {
    return this.prisma.zonaEleitoral.delete({ where: { id } });
  }

  // ---- SECOES ----
  async getSecoesEleitorais(zonaId?: string) {
    return this.prisma.secaoEleitoral.findMany({
      where: zonaId ? { zonaId } : undefined,
      include: {
        zona: {
          select: {
            numeroZona: true,
            municipio: { select: { nome: true } },
          },
        },
      },
      orderBy: { numeroSecao: 'asc' },
    });
  }

  async createSecao(data: any) {
    return this.prisma.secaoEleitoral.create({ data });
  }

  async deleteSecao(id: string) {
    return this.prisma.secaoEleitoral.delete({ where: { id } });
  }

  // ---- DISTRITOS ----
  async getDistritos(municipioId?: string) {
    return this.prisma.distrito.findMany({
      where: municipioId ? { municipioId } : undefined,
      orderBy: { nome: 'asc' },
    });
  }

  // ---- COMUNIDADES ----
  async getComunidades(bairroId?: string) {
    return this.prisma.comunidade.findMany({
      where: bairroId ? { bairroId } : undefined,
      include: { bairro: { select: { nome: true } } },
      orderBy: { nome: 'asc' },
    });
  }

  async getAreasAtuacao(tenantId: string, municipioId?: string) {
    const areas = await this.prisma.mapaSetor.findMany({
      where: {
        tenantId,
        tipo: 'area_atuacao',
        ...(municipioId ? { metadata: { path: ['municipioId'], equals: municipioId } } : {}),
      },
      orderBy: { nome: 'asc' },
    });

    const municipios = await this.prisma.municipio.findMany({
      where: {
        id: {
          in: areas
            .map((area) => (area.metadata as any)?.municipioId)
            .filter(Boolean),
        },
      },
      select: { id: true, nome: true },
    });
    const municipiosById = new Map(municipios.map((m) => [m.id, m]));

    return areas.map((area) => {
      const metadata = (area.metadata || {}) as Record<string, any>;
      const areaMunicipioId = metadata.municipioId;
      return {
        id: area.id,
        nome: area.nome,
        tipo: metadata.tipoArea,
        municipio_id: areaMunicipioId,
        observacoes: metadata.observacoes,
        municipios: areaMunicipioId ? municipiosById.get(areaMunicipioId) : null,
      };
    });
  }
  async createAreaAtuacao(tenantId: string, data: any) {
    const municipioId = data.municipio_id || data.municipioId;
    if (!municipioId) throw new NotFoundException('Município não informado');

    const municipio = await this.prisma.municipio.findUnique({
      where: { id: municipioId },
      select: { id: true, nome: true },
    });
    if (!municipio) throw new NotFoundException('Município não encontrado');

    const area = await this.prisma.mapaSetor.create({
      data: {
        tenantId,
        nome: data.nome,
        tipo: 'area_atuacao',
        metadata: {
          municipioId,
          tipoArea: data.tipo,
          observacoes: data.observacoes,
        },
      },
    });

    return {
      id: area.id,
      nome: area.nome,
      tipo: data.tipo,
      municipio_id: municipioId,
      observacoes: data.observacoes,
      municipios: municipio,
    };
  }
  async deleteAreaAtuacao(tenantId: string, id: string) {
    const area = await this.prisma.mapaSetor.findFirst({
      where: { id, tenantId, tipo: 'area_atuacao' },
    });
    if (!area) throw new NotFoundException('Área de atuação não encontrada');
    return this.prisma.mapaSetor.delete({ where: { id } });
  }
}
