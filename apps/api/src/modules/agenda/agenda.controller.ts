import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get()
  findAll(@Query('month') month?: string) {
    return this.agendaService.findAll(month);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agendaService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Request() req: any) {
    return this.agendaService.create(data, req.user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.agendaService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agendaService.delete(id);
  }

  // ---- PARTICIPANTES ----
  @Get(':id/participantes')
  getParticipantes(@Param('id') id: string) {
    return this.agendaService.getParticipantes(id);
  }

  @Post(':id/participantes')
  createParticipante(@Param('id') id: string, @Body() data: any) {
    return this.agendaService.createParticipante({ ...data, agendaId: id });
  }

  @Patch('participantes/:participanteId')
  updateParticipante(@Param('participanteId') participanteId: string, @Body() data: any) {
    return this.agendaService.updateParticipante(participanteId, data);
  }

  @Delete('participantes/:participanteId')
  deleteParticipante(@Param('participanteId') participanteId: string) {
    return this.agendaService.deleteParticipante(participanteId);
  }

  // ---- CHECKINS ----
  @Get(':id/checkins')
  getCheckins(@Param('id') id: string) {
    return this.agendaService.getCheckins(id);
  }

  @Post(':id/checkins')
  createCheckin(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.agendaService.createCheckin({ ...data, agendaId: id }, req.user.sub);
  }

  // ---- FOLLOWUPS ----
  @Get(':id/followups')
  getFollowups(@Param('id') id: string) {
    return this.agendaService.getFollowups(id);
  }

  @Post(':id/followups')
  createFollowup(@Param('id') id: string, @Body() data: any) {
    return this.agendaService.createFollowup({ ...data, agendaId: id });
  }

  @Patch('followups/:followupId')
  updateFollowup(@Param('followupId') followupId: string, @Body() data: any) {
    return this.agendaService.updateFollowup(followupId, data);
  }
}
