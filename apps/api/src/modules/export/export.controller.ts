import { Controller, Get, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get(':table')
  exportTable(
    @Param('table') table: string,
    @CurrentTenant() tenantId: string,
    @Query() query: any,
  ) {
    if (!table) {
      throw new BadRequestException('Table name is required');
    }
    return this.exportService.exportTable(tenantId, table, query);
  }
}
