import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationService } from './integration.service';

@Injectable()
export class ProductSyncService {
  private readonly logger = new Logger(ProductSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationService: IntegrationService,
  ) {}

  async syncProducts(connectionId: string): Promise<void> {
    const conn = await this.prisma.ecommerceConnection.findUnique({
      where: { id: connectionId },
    });
    if (!conn || !conn.isActive || !conn.syncProducts) return;

    const startedAt = Date.now();
    let total = 0, synced = 0, failed = 0;
    const errors: any[] = [];

    await this.prisma.ecommerceConnection.update({
      where: { id: connectionId },
      data: { syncStatus: 'SYNCING' },
    });

    try {
      const driver = this.integrationService.buildDriver(conn);
      const products = await this.prisma.product.findMany({
        where: { tenantId: conn.tenantId, isActive: true },
        include: {
          inventory: true,
          brand: true,
          category: true,
        },
      });

      total = products.length;

      for (const product of products) {
        const stock = product.inventory.reduce(
          (sum, inv) => sum + Number(inv.quantity),
          0,
        );

        const existingMapping = await this.prisma.productMapping.findFirst({
          where: { connectionId, nexoposProductId: product.id },
        });

        try {
          if (!existingMapping) {
            const result = await driver.pushProduct({
              nexoposProductId: product.id,
              name: product.name,
              sku: product.sku ?? undefined,
              price: product.price,
              stock,
              imageUrl: product.image ?? undefined,
              description: product.description ?? undefined,
            });

            if (result.success && result.externalId) {
              await this.prisma.productMapping.create({
                data: {
                  connectionId,
                  nexoposProductId: product.id,
                  externalId: result.externalId,
                  externalVariantId: result.externalVariantId,
                  lastPushedAt: new Date(),
                },
              });
              synced++;
            } else {
              failed++;
              errors.push({ productId: product.id, error: result.error });
            }
          } else {
            const result = await driver.updateProduct(existingMapping.externalId, {
              name: product.name,
              price: product.price,
              description: product.description ?? undefined,
            });

            if (result.success) {
              await this.prisma.productMapping.update({
                where: { id: existingMapping.id },
                data: { lastPushedAt: new Date() },
              });
              synced++;
            } else {
              failed++;
              errors.push({ productId: product.id, error: result.error });
            }
          }
        } catch (err: any) {
          failed++;
          errors.push({ productId: product.id, error: err.message });
          this.logger.error(`Error syncing product ${product.id}: ${err.message}`);
        }
      }

      await this.prisma.ecommerceConnection.update({
        where: { id: connectionId },
        data: {
          syncStatus: failed > 0 && synced === 0 ? 'ERROR' : failed > 0 ? 'PARTIAL' : 'SUCCESS',
          lastSyncAt: new Date(),
          lastError: failed > 0 ? `${failed} productos fallaron` : null,
        },
      });
    } catch (err: any) {
      this.logger.error(`syncProducts fatal error for ${connectionId}: ${err.message}`);
      await this.prisma.ecommerceConnection.update({
        where: { id: connectionId },
        data: { syncStatus: 'ERROR', lastError: err.message },
      });
      failed = total;
    } finally {
      await this.prisma.syncLog.create({
        data: {
          connectionId,
          tenantId: conn.tenantId,
          entityType: 'PRODUCT',
          direction: 'PUSH',
          status: failed > 0 && synced === 0 ? 'ERROR' : failed > 0 ? 'PARTIAL' : 'SUCCESS',
          total,
          synced,
          failed,
          errors: errors.length > 0 ? errors : undefined,
          durationMs: Date.now() - startedAt,
          completedAt: new Date(),
        },
      });
    }
  }

  async syncAllActiveConnections(): Promise<void> {
    const connections = await this.prisma.ecommerceConnection.findMany({
      where: { isActive: true, syncProducts: true },
      select: { id: true },
    });

    for (const conn of connections) {
      await this.syncProducts(conn.id).catch((e) =>
        this.logger.error(`syncProducts failed for ${conn.id}: ${e.message}`),
      );
    }
  }
}
