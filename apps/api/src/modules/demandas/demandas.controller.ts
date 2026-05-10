import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { DemandasService } from './demandas.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('demandas')
export class DemandasController {
  constructor(private readonly demandasService: DemandasService) {}

  @Get()
  findAll(@Query() filters: any) {
    return this.demandasService.findAll(filters);
  }

  @Get('stats')
  getStats() {
    return this.demandasService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.demandasService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Request() req: any) {
    return this.demandasService.create(data, req.user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.demandasService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.demandasService.delete(id);
  }

  // ---- ENCAMINHAMENTOS ----
  @Get(':id/encaminhamentos')
  getEncaminhamentos(@Param('id') id: string) {
    return this.demandasService.getEncaminhamentos(id);
  }

  @Post(':id/encaminhamentos')
  createEncaminhamento(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.demandasService.createEncaminhamento({ ...data, demandaId: id }, req.user.sub);
  }

  // ---- ANEXOS ----
  @Get(':id/anexos')
  getAnexos(@Param('id') id: string) {
    return this.demandasService.getAnexos(id);
  }

  @Post(':id/anexos')
  createAnexo(@Param('id') id: string, @Body() data: any) {
    return this.demandasService.createAnexo({ ...data, demandaId: id });
  }
}
