import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TerritorialService } from './territorial.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import {
  CreateMunicipioDto,
  UpdateMunicipioDto,
  CreateBairroDto,
  UpdateBairroDto,
  CreateZonaDto,
  CreateSecaoDto,
  CreateAreaAtuacaoDto,
} from './dto/territorial.dto';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('territorial')
export class TerritorialController {
  constructor(private readonly territorialService: TerritorialService) {}

  @Get('estados')
  getEstados() {
    return this.territorialService.getEstados();
  }

  // ---- MUNICIPIOS ----
  @Get('municipios')
  getMunicipios(@Query('estadoId') estadoId?: string) {
    return this.territorialService.getMunicipios(estadoId);
  }
  @Post('municipios')
  createMunicipio(@Body() data: CreateMunicipioDto) {
    return this.territorialService.createMunicipio(data);
  }
  @Patch('municipios/:id')
  updateMunicipio(@Param('id') id: string, @Body() data: UpdateMunicipioDto) {
    return this.territorialService.updateMunicipio(id, data);
  }
  @Delete('municipios/:id')
  deleteMunicipio(@Param('id') id: string) {
    return this.territorialService.deleteMunicipio(id);
  }

  // ---- BAIRROS ----
  @Get('bairros')
  getBairros(@Query('municipioId') municipioId?: string) {
    return this.territorialService.getBairros(municipioId);
  }
  @Post('bairros')
  createBairro(@Body() data: CreateBairroDto) {
    return this.territorialService.createBairro(data);
  }
  @Patch('bairros/:id')
  updateBairro(@Param('id') id: string, @Body() data: UpdateBairroDto) {
    return this.territorialService.updateBairro(id, data);
  }
  @Delete('bairros/:id')
  deleteBairro(@Param('id') id: string) {
    return this.territorialService.deleteBairro(id);
  }

  // ---- ZONAS ----
  @Get('zonas')
  getZonas(@Query('municipioId') municipioId?: string) {
    return this.territorialService.getZonasEleitorais(municipioId);
  }
  @Post('zonas')
  createZona(@Body() data: CreateZonaDto) {
    return this.territorialService.createZona(data);
  }
  @Delete('zonas/:id')
  deleteZona(@Param('id') id: string) {
    return this.territorialService.deleteZona(id);
  }

  // ---- SECOES ----
  @Get('secoes')
  getSecoes(@Query('zonaId') zonaId?: string) {
    return this.territorialService.getSecoesEleitorais(zonaId);
  }
  @Post('secoes')
  createSecao(@Body() data: CreateSecaoDto) {
    return this.territorialService.createSecao(data);
  }
  @Delete('secoes/:id')
  deleteSecao(@Param('id') id: string) {
    return this.territorialService.deleteSecao(id);
  }

  // ---- DISTRITOS & COMUNIDADES ----
  @Get('distritos')
  getDistritos(@Query('municipioId') municipioId?: string) {
    return this.territorialService.getDistritos(municipioId);
  }
  @Get('comunidades')
  getComunidades(@Query('bairroId') bairroId?: string) {
    return this.territorialService.getComunidades(bairroId);
  }

  // ---- AREAS DE ATUACAO ----
  @Get('areas-atuacao')
  getAreasAtuacao(
    @CurrentTenant() tenantId: string,
    @Query('municipioId') municipioId?: string,
  ) {
    return this.territorialService.getAreasAtuacao(tenantId, municipioId);
  }
  @Post('areas-atuacao')
  createAreaAtuacao(
    @CurrentTenant() tenantId: string,
    @Body() data: CreateAreaAtuacaoDto,
  ) {
    return this.territorialService.createAreaAtuacao(tenantId, data);
  }
  @Delete('areas-atuacao/:id')
  deleteAreaAtuacao(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.territorialService.deleteAreaAtuacao(tenantId, id);
  }
}
