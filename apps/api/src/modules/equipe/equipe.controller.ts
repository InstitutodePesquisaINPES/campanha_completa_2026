import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { EquipeService } from './equipe.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateEquipeUserDto, UpdateEquipeUserDto } from './dto/equipe.dto';
import { CurrentTenant, CurrentUser } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('equipe')
export class EquipeController {
  constructor(private readonly equipeService: EquipeService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.equipeService.findAll(tenantId);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
    @Body() data: CreateEquipeUserDto,
  ) {
    return this.equipeService.create(tenantId, userId, data);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() data: UpdateEquipeUserDto,
  ) {
    return this.equipeService.update(tenantId, userId, id, data);
  }

  @Get('logs')
  getGlobalLogs(@CurrentTenant() tenantId: string) {
    return this.equipeService.getLogs(tenantId);
  }

  @Get(':id/logs')
  getUserLogs(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.equipeService.getLogs(tenantId, id);
  }
}
