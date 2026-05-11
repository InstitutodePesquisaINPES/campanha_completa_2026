import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { CampanhasModule } from './modules/campanhas/campanhas.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AiModule } from './modules/ai/ai.module';
import { ComunicacaoModule } from './modules/comunicacao/comunicacao.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CrmModule } from './modules/crm/crm.module';
import { TerritorioModule } from './modules/territorio/territorio.module';
import { TerritorialModule } from './modules/territorial/territorial.module';
import { AgendaModule } from './modules/agenda/agenda.module';
import { DemandasModule } from './modules/demandas/demandas.module';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { NotificacoesModule } from './modules/notificacoes/notificacoes.module';
import { ComandoModule } from './modules/comando/comando.module';
import { CampoModule } from './modules/campo/campo.module';
import { PesquisasModule } from './modules/pesquisas/pesquisas.module';
import { ContratosModule } from './modules/contratos/contratos.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InteligenciaModule } from './modules/inteligencia/inteligencia.module';
import { ScoreModule } from './modules/score/score.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { AdminModule } from './modules/admin/admin.module';
import { EquipeModule } from './modules/equipe/equipe.module';
import { TseModule } from './modules/tse/tse.module';
import { ExportModule } from './modules/export/export.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT')
            ? parseInt(configService.get('REDIS_PORT')!)
            : 6379,
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    TenantModule,
    CampanhasModule,
    ProfileModule,
    AiModule,
    ComunicacaoModule,
    CrmModule,
    TerritorioModule,
    TerritorialModule,
    AgendaModule,
    DemandasModule,
    DocumentosModule,
    NotificacoesModule,
    ComandoModule,
    CampoModule,
    PesquisasModule,
    ContratosModule,
    DashboardModule,
    InteligenciaModule,
    ScoreModule,
    SystemSettingsModule,
    AdminModule,
    EquipeModule,
    TseModule,
    ExportModule,
  ],
})
export class AppModule {}
