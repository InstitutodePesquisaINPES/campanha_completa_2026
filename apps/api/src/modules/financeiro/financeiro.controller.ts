import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  // ---- CENTROS DE CUSTO ----
  @Get('centros-custo')
  getCentrosCusto() {
    return this.financeiroService.getCentrosCusto();
  }

  @Post('centros-custo')
  createCentroCusto(@Body() data: any) {
    return this.financeiroService.createCentroCusto(data);
  }

  @Delete('centros-custo/:id')
  removeCentroCusto(@Param('id') id: string) {
    return this.financeiroService.deleteCentroCusto(id);
  }

  // ---- DESPESAS ----
  @Get('despesas')
  findAllDespesas(@Query('centroCustoId') centroCustoId?: string) {
    return this.financeiroService.findAllDespesas(centroCustoId);
  }

  @Post('despesas')
  createDespesa(@Body() data: any, @Request() req: any) {
    return this.financeiroService.createDespesa(data, req.user.sub);
  }

  @Patch('despesas/:id')
  updateDespesa(@Param('id') id: string, @Body() data: any) {
    return this.financeiroService.updateDespesa(id, data);
  }

  @Delete('despesas/:id')
  removeDespesa(@Param('id') id: string) {
    return this.financeiroService.deleteDespesa(id);
  }

  // ---- RECEITAS ----
  @Get('receitas')
  findAllReceitas(@Query('centroCustoId') centroCustoId?: string) {
    return this.financeiroService.findAllReceitas(centroCustoId);
  }

  @Post('receitas')
  createReceita(@Body() data: any) {
    return this.financeiroService.createReceita(data);
  }

  @Delete('receitas/:id')
  removeReceita(@Param('id') id: string) {
    return this.financeiroService.deleteReceita(id);
  }
}
