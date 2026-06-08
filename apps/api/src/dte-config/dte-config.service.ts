import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateDteConfigDto {
  tenantId: string;
  liorenToken?: string;
  liorenLogo?: string;
  dteResolution?: string;
  resolutionDate?: Date;
}

interface UpdateDteConfigDto {
  liorenToken?: string;
  liorenLogo?: string;
  dteResolution?: string;
  resolutionDate?: Date;
}

export interface DteConfigResponseDto {
  id: string;
  tenantId: string;
  liorenToken?: string;
  liorenLogo?: string;
  dteResolution?: string;
  resolutionDate?: Date;
}

@Injectable()
export class DteConfigService {
  constructor(private prisma: PrismaService) {}

  async findByTenant(tenantId: string): Promise<DteConfigResponseDto | null> {
    const config = await this.prisma.dteConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      return null;
    }

    return {
      id: config.id,
      tenantId: config.tenantId,
      liorenToken: config.liorenToken || undefined,
      liorenLogo: config.liorenLogo || undefined,
      dteResolution: config.dteResolution || undefined,
      resolutionDate: config.resolutionDate || undefined,
    };
  }

  async upsert(
    createDteConfigDto: CreateDteConfigDto,
  ): Promise<DteConfigResponseDto> {
    // Build the update data with only the fields that were explicitly provided.
    // This prevents undefined fields from overwriting existing DB values with null.
    const updateData: Partial<UpdateDteConfigDto> = {};
    if (createDteConfigDto.liorenToken !== undefined)
      updateData.liorenToken = createDteConfigDto.liorenToken;
    if (createDteConfigDto.liorenLogo !== undefined)
      updateData.liorenLogo = createDteConfigDto.liorenLogo;
    if (createDteConfigDto.dteResolution !== undefined)
      updateData.dteResolution = createDteConfigDto.dteResolution;
    if (createDteConfigDto.resolutionDate !== undefined)
      updateData.resolutionDate = createDteConfigDto.resolutionDate;

    const config = await this.prisma.dteConfig.upsert({
      where: { tenantId: createDteConfigDto.tenantId },
      update: updateData,
      create: {
        tenantId: createDteConfigDto.tenantId,
        liorenToken: createDteConfigDto.liorenToken,
        liorenLogo: createDteConfigDto.liorenLogo,
        dteResolution: createDteConfigDto.dteResolution,
        resolutionDate: createDteConfigDto.resolutionDate,
      },
    });

    return {
      id: config.id,
      tenantId: config.tenantId,
      liorenToken: config.liorenToken || undefined,
      liorenLogo: config.liorenLogo || undefined,
      dteResolution: config.dteResolution || undefined,
      resolutionDate: config.resolutionDate || undefined,
    };
  }

  async getStats(tenantId: string) {
    const DTE_LABELS: Record<number, string> = {
      39: 'Boleta electrónica',
      33: 'Factura electrónica',
      61: 'Nota de crédito',
      52: 'Guía de despacho',
    };

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [byType, thisMonth, recentDocs, errorCount] = await Promise.all([
      // Totals by document type (accepted only)
      this.prisma.sale.groupBy({
        by: ['dteType'],
        where: { tenantId, dteStatus: 'ACEPTADO', dteFolio: { not: null } },
        _count: { id: true },
        _max: { dteFolio: true },
      }),

      // This month count
      this.prisma.sale.count({
        where: { tenantId, dteStatus: 'ACEPTADO', createdAt: { gte: firstOfMonth } },
      }),

      // Last 8 issued documents
      this.prisma.sale.findMany({
        where: { tenantId, dteStatus: 'ACEPTADO', dteFolio: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          dteFolio: true,
          dteType: true,
          dtePdfUrl: true,
          total: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
      }),

      // Error count
      this.prisma.sale.count({
        where: { tenantId, dteStatus: 'ERROR' },
      }),
    ]);

    const totalAccepted = byType.reduce((s, g) => s + g._count.id, 0);

    return {
      totalAccepted,
      thisMonth,
      errorCount,
      byType: byType.map(g => ({
        type: g.dteType,
        label: DTE_LABELS[g.dteType] ?? `Tipo ${g.dteType}`,
        count: g._count.id,
        lastFolio: g._max.dteFolio,
      })),
      recentDocs: recentDocs.map(s => ({
        id: s.id,
        folio: s.dteFolio,
        type: s.dteType,
        label: DTE_LABELS[s.dteType] ?? `Tipo ${s.dteType}`,
        pdfUrl: s.dtePdfUrl,
        total: s.total,
        createdAt: s.createdAt,
        customerName: s.customer?.name ?? null,
      })),
    };
  }

  async update(
    id: string,
    updateDteConfigDto: UpdateDteConfigDto,
  ): Promise<DteConfigResponseDto> {
    const config = await this.prisma.dteConfig.update({
      where: { id },
      data: updateDteConfigDto,
    });

    return {
      id: config.id,
      tenantId: config.tenantId,
      liorenToken: config.liorenToken || undefined,
      liorenLogo: config.liorenLogo || undefined,
      dteResolution: config.dteResolution || undefined,
      resolutionDate: config.resolutionDate || undefined,
    };
  }
}
