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
import { CrmService } from './crm.service';
import { SegmentacaoService } from './segmentacao.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import {
  CurrentTenant,
  CurrentUser,
} from '../../common/decorators/tenant.decorator';
import {
  CreatePessoaDto,
  UpdatePessoaDto,
  CreateTagDto,
  CreateContatoDto,
  CreateEnderecoDto,
  CreatePapelDto,
  GerarSegmentacaoDto,
} from './dto/crm.dto';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('pessoas')
export class CrmController {
  constructor(
    private readonly crmService: CrmService,
    private readonly segmentacaoService: SegmentacaoService,
  ) {}

  @Post('segmentacao')
  gerarSegmentacao(@Body() filtros: GerarSegmentacaoDto, @CurrentTenant() tenantId: string) {
    return this.segmentacaoService.gerarAudiencia(filtros);
  }

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('nivel') nivel?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.crmService.findAll(tenantId, search, nivel, tipo);
  }

  @Get('tags')
  getTags(@CurrentTenant() tenantId: string) {
    return this.crmService.getTags(tenantId);
  }

  @Post('tags')
  createTag(@Body() data: CreateTagDto, @CurrentTenant() tenantId: string) {
    return this.crmService.createTag(data, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.crmService.findOne(id, tenantId);
  }

  @Post()
  create(
    @Body() data: CreatePessoaDto,
    @CurrentUser() userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.crmService.create(data, userId, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdatePessoaDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.crmService.update(id, data, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.crmService.delete(id, tenantId);
  }

  // ---- CONTATOS ----
  @Get(':id/contatos')
  getContatos(@Param('id') id: string) {
    return this.crmService.getContatos(id);
  }

  @Post(':id/contatos')
  createContato(@Param('id') id: string, @Body() data: CreateContatoDto) {
    return this.crmService.createContato({ ...data, pessoaId: id });
  }

  @Delete('contatos/:contatoId')
  deleteContato(@Param('contatoId') contatoId: string) {
    return this.crmService.deleteContato(contatoId);
  }

  // ---- ENDEREÇOS ----
  @Get(':id/enderecos')
  getEnderecos(@Param('id') id: string) {
    return this.crmService.getEnderecos(id);
  }

  @Post(':id/enderecos')
  createEndereco(@Param('id') id: string, @Body() data: CreateEnderecoDto) {
    return this.crmService.createEndereco({ ...data, pessoaId: id });
  }

  @Delete('enderecos/:enderecoId')
  deleteEndereco(@Param('enderecoId') enderecoId: string) {
    return this.crmService.deleteEndereco(enderecoId);
  }

  // ---- PAPEIS ----
  @Get(':id/papeis')
  getPapeis(@Param('id') id: string) {
    return this.crmService.getPapeis(id);
  }

  @Post(':id/papeis')
  createPapel(@Param('id') id: string, @Body() data: CreatePapelDto) {
    return this.crmService.createPapel({ ...data, pessoaId: id });
  }

  @Delete('papeis/:papelId')
  deletePapel(@Param('papelId') papelId: string) {
    return this.crmService.deletePapel(papelId);
  }

  // ---- PESSOAS_TAGS ----
  @Post(':id/tags/:tagId')
  addPessoaTag(@Param('id') id: string, @Param('tagId') tagId: string) {
    return this.crmService.addPessoaTag(id, tagId);
  }

  @Delete(':id/tags/:tagId')
  removePessoaTag(@Param('id') id: string, @Param('tagId') tagId: string) {
    return this.crmService.removePessoaTag(id, tagId);
  }
}
