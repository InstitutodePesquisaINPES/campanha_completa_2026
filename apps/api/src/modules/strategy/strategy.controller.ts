import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('strategy')
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  @Post('campanhas')
  createCampanha(@Body() data: any, @Request() req: any) {
    return this.strategyService.createCampanha(data, req.user.sub);
  }

  @Get('campanhas')
  getCampanhas() {
    return this.strategyService.getCampanhas();
  }

  @Post('campanhas/:id/eixos')
  createEixo(@Param('id') campanhaId: string, @Body() data: any) {
    return this.strategyService.createEixo(campanhaId, data);
  }

  @Post('campanhas/:id/parcerias')
  createParceria(@Param('id') campanhaId: string, @Body() data: any) {
    return this.strategyService.createParceria(campanhaId, data);
  }

  @Post('eixos/:eixoId/planos')
  createPlanoAcao(@Param('eixoId') eixoId: string, @Body() data: any) {
    return this.strategyService.createPlanoAcao(eixoId, data);
  }

  @Get('eixos/:eixoId/cronograma')
  getCronograma(@Param('eixoId') eixoId: string) {
    return this.strategyService.getCronogramaPlanoAcao(eixoId);
  }

  @Get('war-room/:campanhaId')
  getWarRoomStats(@Param('campanhaId') campanhaId: string) {
    return this.strategyService.getWarRoomStats(campanhaId);
  }
}
