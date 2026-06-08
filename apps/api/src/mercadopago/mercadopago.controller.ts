import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { MercadopagoService } from './mercadopago.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('mercadopago')
@UseGuards(JwtAuthGuard)
export class MercadopagoController {
  constructor(
    private readonly mercadopagoService: MercadopagoService,
    private readonly prisma: PrismaService
  ) {}

  @Post('subscribe-module')
  async subscribeModule(@Req() req: any, @Body() body: { moduleId: string }) {
    const { tenantId } = req.user;
    
    // Fetch module to get name and price
    const module = await this.prisma.module.findUnique({
      where: { id: body.moduleId }
    });

    if (!module) {
      throw new Error('Módulo no encontrado');
    }

    return this.mercadopagoService.createSubscriptionPreference(
      tenantId,
      module.name,
      module.price
    );
  }
}
