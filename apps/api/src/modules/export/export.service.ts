import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportTable(tenantId: string, table: string, query: any) {
    const allowedTables = [
      'pessoas',
      'demandas',
      'agenda',
      'municipios',
      'bairros',
      'materiais',
      'despesas',
      'receitas',
      'campanhas',
      'audit_logs',
      'centros_custo'
    ];

    if (!allowedTables.includes(table)) {
      throw new BadRequestException(`Export for table ${table} is not supported or not allowed.`);
    }

    // A basic implementation. A real implementation should handle `query` filters 
    // exactly how the frontend expects it, parsing operators like `eq`, `ilike`, etc.
    const prismaModelName = this.getPrismaModelName(table);

    if (!prismaModelName || !(this.prisma as any)[prismaModelName]) {
      throw new BadRequestException(`Model ${prismaModelName} not found`);
    }

    try {
      // Very simple findMany - assuming all tables have tenantId except some global ones
      const isGlobalTable = ['municipios', 'bairros', 'estados'].includes(table);
      
      const records = await (this.prisma as any)[prismaModelName].findMany({
        where: isGlobalTable ? {} : { tenantId },
        // Add basic support for limits
        ...(query.limit ? { take: parseInt(query.limit as string, 10) } : {}),
      });

      return records;
    } catch (e: any) {
      throw new BadRequestException(`Error exporting table: ${e.message}`);
    }
  }

  private getPrismaModelName(table: string): string {
    const map: Record<string, string> = {
      'pessoas': 'pessoa',
      'demandas': 'demanda',
      'agenda': 'agenda',
      'municipios': 'municipio',
      'bairros': 'bairro',
      'materiais': 'material',
      'despesas': 'despesa',
      'receitas': 'receita',
      'campanhas': 'campanha',
      'audit_logs': 'auditLog',
      'centros_custo': 'centroCusto',
    };
    return map[table];
  }
}
