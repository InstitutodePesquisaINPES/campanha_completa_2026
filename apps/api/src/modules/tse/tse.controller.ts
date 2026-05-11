import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TseService } from './tse.service';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards/tenant.guard';
import {
  CurrentTenant,
  CurrentUser,
} from '../../common/decorators/tenant.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('tse')
@UseGuards(AuthGuard('jwt'), TenantGuard)
export class TseController {
  constructor(private readonly tseService: TseService) {}

  // ─── STATS ────────────────────────────────────────────────

  @Get('stats')
  async getStats(@CurrentTenant() tenantId: string) {
    return this.tseService.getStats(tenantId);
  }

  // ─── RESUMO MUNICIPIOS ────────────────────────────────────

  @Get('resumo-municipios')
  async getResumoMunicipios(
    @CurrentTenant() tenantId: string,
    @Query('ano') ano: string,
    @Query('uf') uf: string,
  ) {
    return this.tseService.getResumoMunicipios(
      tenantId,
      parseInt(ano, 10) || 2024,
      uf || 'BR',
    );
  }

  // ─── IMPORT JOBS ──────────────────────────────────────────

  @Get('jobs')
  async getJobs(@CurrentTenant() tenantId: string) {
    return this.tseService.getJobs(tenantId);
  }

  @Get('jobs/:jobId/logs')
  async getJobLogs(
    @CurrentTenant() tenantId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.tseService.getJobLogs(tenantId, jobId);
  }

  @Post('jobs/enqueue')
  async enqueueJob(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.tseService.enqueueJob(tenantId, body);
  }

  @Post('jobs/run')
  async runWorker(@CurrentTenant() tenantId: string) {
    return this.tseService.runWorker(tenantId);
  }

  @Delete('jobs/:id')
  async cancelJob(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.tseService.cancelJob(tenantId, id);
  }

  // ─── CSV ARQUIVOS ─────────────────────────────────────────

  @Get('arquivos')
  async getArquivos(@CurrentTenant() tenantId: string) {
    return this.tseService.getArquivos(tenantId);
  }

  @Post('arquivos')
  async saveArquivoMeta(
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
    @Body() body: any,
  ) {
    return this.tseService.saveArquivoMeta(tenantId, userId, body);
  }

  @Patch('arquivos/:id')
  async updateArquivo(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.tseService.updateArquivo(tenantId, id, body);
  }

  @Delete('arquivos/:id')
  async deleteArquivo(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.tseService.deleteArquivo(tenantId, id);
  }

  // ─── UPLOAD CHUNK ─────────────────────────────────────────

  @Post('upload-chunk')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/tse',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per chunk
    }),
  )
  async uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.tseService.handleUploadChunk(file, body);
  }

  // ─── INGEST CHUNK (anti-duplication core) ─────────────────

  @Post('ingest-chunk')
  async ingestChunk(
    @CurrentTenant() tenantId: string,
    @Body() body: { tabela: string; registros: any[] },
  ) {
    return this.tseService.ingestChunk(tenantId, body.tabela, body.registros);
  }
}
