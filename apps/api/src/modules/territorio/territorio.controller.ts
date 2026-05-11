import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TerritorioService } from './territorio.service';
import { IbgeService } from './ibge.service';
import { ViaCepService } from './viacep.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  UpdateMunicipioStrategyDto,
  CreateBairroDto,
  ImportBairrosDto,
  CreateMapaCenarioDto,
  CreateMapaSetorDto,
  UpdateMapaSetorDto,
} from './dto/territorio.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    [key: string]: unknown;
  };
  tenantId: string;
}

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('territorio')
export class TerritorioController {
  constructor(
    private readonly territorioService: TerritorioService,
    private readonly ibgeService: IbgeService,
    private readonly viaCepService: ViaCepService,
  ) {}

  @Get('cep/:cep')
  async consultaCep(@Param('cep') cep: string) {
    return this.viaCepService.consultaCep(cep);
  }

  @Post('sync-ibge')
  @UseGuards(RolesGuard)
  @Roles('super-admin', 'admin') // Somente admins podem rodar essa sync pesada
  async syncIbge() {
    return this.ibgeService.syncIbgeTerritories();
  }

  @Get('estados')
  async getEstados() {
    return this.territorioService.getEstados();
  }

  @Get('stats')
  async getStats() {
    return this.territorioService.getStats();
  }

  @Post('importar-ibge')
  async importarIbge(@Body() body: any) {
    return this.territorioService.importarIbge(body);
  }

  @Get('municipios')
  getMunicipios(
    @Query('estadoId') estadoId?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('fields') fields?: string,
  ) {
    return this.territorioService.getMunicipios(estadoId, search, limit ? parseInt(limit) : undefined);
  }

  @Get('municipios/strategic')
  getStrategicMunicipios(@CurrentTenant() tenantId: string) {
    return this.territorioService.getStrategicMunicipios(tenantId);
  }

  @Put('municipios/:id/strategy')
  updateMunicipioStrategy(
    @Param('id') id: string,
    @Body() payload: UpdateMunicipioStrategyDto,
  ) {
    return this.territorioService.updateMunicipioStrategy(id, payload);
  }

  @Get('bairros')
  getBairros(@Query('municipioId') municipioId: string) {
    return this.territorioService.getBairros(municipioId);
  }

  @Post('bairros')
  createBairro(@Body() payload: CreateBairroDto) {
    return this.territorioService.createBairro(payload);
  }

  @Post('bairros/import')
  importBairros(@Body() payload: ImportBairrosDto) {
    return this.territorioService.importBairros(
      payload.municipioId,
      payload.nomes,
    );
  }

  @Get('mapa-estrategico/bairros')
  getMapaEstrategicoBairros(
    @CurrentTenant() tenantId: string,
    @Query('municipioId') municipioId?: string,
  ) {
    return this.territorioService.getMapaEstrategicoBairros(
      tenantId,
      municipioId,
    );
  }

  // Cenários
  @Get('cenarios')
  getMapaCenarios(
    @CurrentTenant() tenantId: string,
    @Query('campanhaId') campanhaId?: string,
  ) {
    return this.territorioService.getMapaCenarios(tenantId, campanhaId);
  }

  @Post('cenarios')
  createMapaCenario(
    @Body() payload: CreateMapaCenarioDto,
    @CurrentTenant() tenantId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.territorioService.createMapaCenario(
      tenantId,
      req.user.userId,
      payload,
    );
  }

  @Delete('cenarios/:id')
  removeMapaCenario(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.territorioService.removeMapaCenario(tenantId, id);
  }

  // Setores
  @Get('setores')
  getMapaSetores(
    @CurrentTenant() tenantId: string,
    @Query('campanhaId') campanhaId?: string,
  ) {
    return this.territorioService.getMapaSetores(tenantId, campanhaId);
  }

  @Post('setores')
  createMapaSetor(
    @Body() payload: CreateMapaSetorDto,
    @CurrentTenant() tenantId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.territorioService.createMapaSetor(
      tenantId,
      req.user.userId,
      payload,
    );
  }

  @Put('setores/:id')
  updateMapaSetor(
    @Param('id') id: string,
    @Body() payload: UpdateMapaSetorDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.territorioService.updateMapaSetor(tenantId, id, payload);
  }

  @Delete('setores/:id')
  removeMapaSetor(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.territorioService.removeMapaSetor(tenantId, id);
  }
}
