import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationService } from './integration.service';

@Injectable()
export class InventorySyncService {
  private readonly logger = new Logger(InventorySyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationService: IntegrationService,
  ) {}

  async syncInventory(connectionId: string): Promise<void> {
    const conn = await this.prisma.ecommerceConnection.findUnique({
      where: { id: connectionId },
    });
    if (!conn || !conn.isActive || !conn.syncInventory) return;

    const startedAt = Date.now();
    let total = 0, synced = 0, failed = 0;
    const errors: any[] = [];

    try {
      const driver = this.integrationService.buildDriver(conn);

      const mappings = await this.prisma.productMapping.findMany({
        where: { connectionId },
        include: {
          product: {
            include: { inventory: true },
          },
        },
      });

      total = mappings.length;

      for (const mapping of mappings) {
        const stock = mapping.product.inventory.reduce(
          (sum, inv) => sum + Number(inv.quantity),
          0,
        );

        try {
          const result = await driver.setInventoryLevel({
            externalId: mapping.externalId,
            externalVariantId: mapping.externalVariantId ?? undefined,
            stock,
          });

          if (result.success) {
            await this.prisma.productMapping.update({
              where: { id: mapping.id },
              data: { lastPushedAt: new Date() },
            });
            synced++;
          } else {
            failed++;
            errors.push({ mappingId: mapping.id, error: result.error });
          }
        } catch (err: any) {
          failed++;
          errors.push({ mappingId: mapping.id, error: err.message });
        }
      }
    } catch (err: any) {
      this.logger.error(`syncInventory fatal for ${connectionId}: ${err.message}`);
      failed = total;
    } finally {
      await this.prisma.syncLog.create({
        data: {
          connectionId,
          tenantId: conn.tenantId,
          entityType: 'INVENTORY',
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
      where: { isActive: true, syncInventory: true },
      select: { id: true },
    });

    for (const conn of connections) {
      await this.syncInventory(conn.id).catch((e) =>
        this.logger.error(`syncInventory failed for ${conn.id}: ${e.message}`),
      );
    }
  }

  // Llamado externamente tras ajustar stock manualmente en NexoPOS
  async pushStockForProduct(nexoposProductId: string): Promise<void> {
    const mappings = await this.prisma.productMapping.findMany({
      where: { nexoposProductId },
      include: {
        connection: true,
        product: { include: { inventory: true } },
      },
    });

    for (const mapping of mappings) {
      if (!mapping.connection.isActive || !mapping.connection.syncInventory) continue;
      const stock = mapping.product.inventory.reduce(
        (sum, inv) => sum + Number(inv.quantity),
        0,
      );

      try {
        const driver = this.integrationService.buildDriver(mapping.connection);
        await driver.setInventoryLevel({
          externalId: mapping.externalId,
          externalVariantId: mapping.externalVariantId ?? undefined,
          stock,
        });
      } catch (err: any) {
        this.logger.error(`pushStockForProduct failed for mapping ${mapping.id}: ${err.message}`);
      }
    }
  }
}
