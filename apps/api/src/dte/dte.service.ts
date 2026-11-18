import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LiorenService } from './lioren.service';
import { effectiveModuleCodes, moduleTenantInclude } from '../modules/module-access';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DteService {
  constructor(
    private liorenService: LiorenService,
    private prisma: PrismaService,
  ) {}

  async emitirDte(saleId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      select: { dteType: true, tenant: { include: moduleTenantInclude } },
    });

    if (!sale) throw new NotFoundException('Venta no encontrada.');
    const tipodoc = sale.dteType ?? 39;
    const code = ({ 33: 'DTE_FACTURA', 61: 'DTE_NOTA_CREDITO', 52: 'DTE_GUIA_DESPACHO' } as Record<number, string>)[tipodoc] || 'DTE_BOLETA';
    if (sale.tenant.status !== 'ACTIVE' || !effectiveModuleCodes(sale.tenant).includes(code)) throw new ForbiddenException('Este servicio de emisión está deshabilitado para la empresa.');

    switch (tipodoc) {
      case 33:
        return this.liorenService.emitirFactura(saleId);
      case 61:
        return this.liorenService.emitirNotaCredito(saleId);
      case 52:
        return this.liorenService.emitirGuiaDespacho(saleId);
      default:
        return this.liorenService.emitirBoleta(saleId);
    }
  }
  verify(saleId: string, tenantId: string) { return this.liorenService.verify(saleId, tenantId); }
  pdf(saleId: string, user: { tenantId: string; role?: string; branchId?: string }) { return this.liorenService.salePdf(saleId, user); }

}
