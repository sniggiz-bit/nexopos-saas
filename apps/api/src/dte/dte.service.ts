import { Injectable } from '@nestjs/common';
import { LiorenService } from './lioren.service';
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
      select: { dteType: true },
    });

    const tipodoc = sale?.dteType ?? 39;

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
}
