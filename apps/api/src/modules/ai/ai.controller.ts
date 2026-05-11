import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards/tenant.guard';
import {
  CreateAiProviderDto,
  UpdateAiProviderDto,
  CreateAiModelDto,
  UpdateAiModelDto,
  CreateAiCopilotDto,
  UpdateAiCopilotDto,
  AiChatPayloadDto,
} from './dto/ai.dto';

@Controller('ai')
@UseGuards(AuthGuard('jwt'), TenantGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('provedores')
  async getProviders(@Request() req: any) {
    return this.aiService.getProviders(req.tenantId);
  }

  @Post('provedores')
  async createProvider(@Request() req: any, @Body() body: CreateAiProviderDto) {
    return this.aiService.createProvider(req.tenantId, body);
  }

  @Post('provedores/test')
  async testProvider(@Request() req: any, @Body('provedor_id') id: string) {
    return this.aiService.testProvider(req.tenantId, id);
  }

  @Put('provedores/:id')
  async updateProvider(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateAiProviderDto,
  ) {
    return this.aiService.updateProvider(req.tenantId, id, body);
  }

  @Delete('provedores/:id')
  async deleteProvider(@Request() req: any, @Param('id') id: string) {
    return this.aiService.deleteProvider(req.tenantId, id);
  }

  @Get('modelos')
  async getModels(@Request() req: any) {
    return this.aiService.getModels(req.tenantId);
  }

  @Post('modelos')
  async createModel(@Request() req: any, @Body() body: CreateAiModelDto) {
    return this.aiService.createModel(req.tenantId, body);
  }

  @Put('modelos/:id')
  async updateModel(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateAiModelDto,
  ) {
    return this.aiService.updateModel(req.tenantId, id, body);
  }

  @Delete('modelos/:id')
  async deleteModel(@Request() req: any, @Param('id') id: string) {
    return this.aiService.deleteModel(req.tenantId, id);
  }

  @Get('copilots')
  async getCopilots(@Request() req: any) {
    return this.aiService.getCopilots(req.tenantId);
  }

  @Post('copilots')
  async createCopilot(@Request() req: any, @Body() body: CreateAiCopilotDto) {
    return this.aiService.createCopilot(req.tenantId, body);
  }

  @Put('copilots/:id')
  async updateCopilot(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateAiCopilotDto,
  ) {
    return this.aiService.updateCopilot(req.tenantId, id, body);
  }

  @Delete('copilots/:id')
  async deleteCopilot(@Request() req: any, @Param('id') id: string) {
    return this.aiService.deleteCopilot(req.tenantId, id);
  }

  @Post('chat')
  async chat(@Request() req: any, @Body() body: AiChatPayloadDto) {
    return this.aiService.chat(req.tenantId, req.user.userId, body);
  }

  @Get('log')
  async getUsageLog(@Request() req: any) {
    return this.aiService.getUsageLog(req.tenantId);
  }
}
