import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { Request } from '@nestjs/common';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  getKPIs(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getKPIs(tenantId);
  }

  @Get('meus-itens')
  getMeusItens(@CurrentTenant() tenantId: string, @Request() req: any) {
    return this.dashboardService.getMeusItens(tenantId, req.user.userId);
  }

  @Get('busca')
  globalSearch(@CurrentTenant() tenantId: string, @Query('q') q: string) {
    return this.dashboardService.globalSearch(tenantId, q);
  }
}
