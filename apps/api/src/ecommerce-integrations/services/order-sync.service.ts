import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationService } from './integration.service';

@Injectable()
export class OrderSyncService {
  private readonly logger = new Logger(OrderSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationService: IntegrationService,
  ) {}

  async pullOrders(connectionId: string): Promise<void> {
    const conn = await this.prisma.ecommerceConnection.findUnique({
      where: { id: connectionId },
    });
    if (!conn || !conn.isActive || !conn.syncOrders) return;

    const startedAt = Date.now();
    let synced = 0, failed = 0;
    const errors: any[] = [];

    try {
      const driver = this.integrationService.buildDriver(conn);
      const since = conn.lastSyncAt ?? undefined;
      const orders = await driver.pullOrders(since);

      for (const order of orders) {
        try {
          await this.prisma.ecommerceOrder.upsert({
            where: {
              connectionId_externalId: {
                connectionId,
                externalId: order.externalId,
              },
            },
            create: {
              connectionId,
              tenantId: conn.tenantId,
              externalId: order.externalId,
              externalNumber: order.externalNumber,
              platform: conn.platform,
              status: 'PENDING',
              rawData: order.rawData,
            },
            update: {
              rawData: order.rawData,
              updatedAt: new Date(),
            },
          });
          synced++;
        } catch (err: any) {
          failed++;
          errors.push({ orderId: order.externalId, error: err.message });
        }
      }

      await this.prisma.ecommerceConnection.update({
        where: { id: connectionId },
        data: { lastSyncAt: new Date() },
      });
    } catch (err: any) {
      this.logger.error(`pullOrders fatal for ${connectionId}: ${err.message}`);
    } finally {
      await this.prisma.syncLog.create({
        data: {
          connectionId,
          tenantId: conn.tenantId,
          entityType: 'ORDER',
          direction: 'PULL',
          status: failed > 0 && synced === 0 ? 'ERROR' : failed > 0 ? 'PARTIAL' : 'SUCCESS',
          total: synced + failed,
          synced,
          failed,
          errors: errors.length > 0 ? errors : undefined,
          durationMs: Date.now() - startedAt,
          completedAt: new Date(),
        },
      });
    }
  }

  async processOrder(ecommerceOrderId: string): Promise<{ saleId?: string; message: string }> {
    const ecommerceOrder = await this.prisma.ecommerceOrder.findUnique({
      where: { id: ecommerceOrderId },
      include: { connection: true },
    });

    if (!ecommerceOrder) return { message: 'Orden no encontrada' };
    if (ecommerceOrder.status === 'COMPLETED') return { message: 'Orden ya procesada' };

    try {
      await this.prisma.ecommerceOrder.update({
        where: { id: ecommerceOrderId },
        data: { status: 'PROCESSING' },
      });

      const rawData = ecommerceOrder.rawData as any;
      const tenantId = ecommerceOrder.tenantId;

      const branch = await this.prisma.branch.findFirst({
        where: { tenantId, isMain: true },
      });
      if (!branch) throw new Error('Sucursal principal no encontrada');

      const lineItems: any[] = rawData.line_items ?? rawData.lineItems ?? [];
      const saleItems: { productId: string; quantity: number; price: number }[] = [];

      for (const li of lineItems) {
        const externalProductId = String(li.product_id ?? li.product_id ?? '');
        const mapping = await this.prisma.productMapping.findFirst({
          where: {
            connectionId: ecommerceOrder.connectionId,
            externalId: externalProductId,
          },
        });

        if (mapping) {
          saleItems.push({
            productId: mapping.nexoposProductId,
            quantity: li.quantity,
            price: typeof li.price === 'string' ? parseFloat(li.price) * 100 : li.price,
          });
        } else {
          this.logger.warn(
            `No se encontró mapeo para producto externo ${externalProductId} en orden ${ecommerceOrderId}`,
          );
        }
      }

      if (saleItems.length === 0) {
        await this.prisma.ecommerceOrder.update({
          where: { id: ecommerceOrderId },
          data: {
            status: 'IGNORED',
            errorMessage: 'No hay productos mapeados en esta orden',
          },
        });
        return { message: 'Orden ignorada: sin productos mapeados' };
      }

      const total = saleItems.reduce((s, i) => s + i.price * i.quantity, 0);

      const sale = await this.prisma.sale.create({
        data: {
          tenantId,
          branchId: branch.id,
          total,
          status: 'COMPLETED',
          items: {
            create: saleItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
          payments: {
            create: [{ amount: total, paymentMethod: 'TRANSFERENCIA' }],
          },
        },
      });

      await this.prisma.ecommerceOrder.update({
        where: { id: ecommerceOrderId },
        data: {
          status: 'COMPLETED',
          saleId: sale.id,
          processedAt: new Date(),
        },
      });

      return { saleId: sale.id, message: 'Orden procesada correctamente' };
    } catch (err: any) {
      this.logger.error(`processOrder failed for ${ecommerceOrderId}: ${err.message}`);
      await this.prisma.ecommerceOrder.update({
        where: { id: ecommerceOrderId },
        data: { status: 'FAILED', errorMessage: err.message },
      });
      return { message: `Error: ${err.message}` };
    }
  }

  async pullAllActiveConnections(): Promise<void> {
    const connections = await this.prisma.ecommerceConnection.findMany({
      where: { isActive: true, syncOrders: true },
      select: { id: true },
    });

    for (const conn of connections) {
      await this.pullOrders(conn.id).catch((e) =>
        this.logger.error(`pullOrders failed for ${conn.id}: ${e.message}`),
      );
    }
  }
}
