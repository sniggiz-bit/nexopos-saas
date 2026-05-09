import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationService } from './integration.service';
import { OrderSyncService } from './order-sync.service';
import { InventorySyncService } from './inventory-sync.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationService: IntegrationService,
    private readonly orderSyncService: OrderSyncService,
    private readonly inventorySyncService: InventorySyncService,
  ) {}

  validateShopifyHmac(rawBody: Buffer, hmacHeader: string, secret: string): void {
    const digest = createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    const digestBuf = Buffer.from(digest);
    const headerBuf = Buffer.from(hmacHeader);

    if (digestBuf.length !== headerBuf.length || !timingSafeEqual(digestBuf, headerBuf)) {
      throw new UnauthorizedException('HMAC de Shopify inválido');
    }
  }

  validateWooCommerceSignature(rawBody: Buffer, signatureHeader: string, secret: string): void {
    const digest = createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    const digestBuf = Buffer.from(digest);
    const headerBuf = Buffer.from(signatureHeader);

    if (digestBuf.length !== headerBuf.length || !timingSafeEqual(digestBuf, headerBuf)) {
      throw new UnauthorizedException('Firma de WooCommerce inválida');
    }
  }

  async handleShopifyWebhook(
    connectionId: string,
    topic: string,
    rawBody: Buffer,
    hmacHeader: string,
    payload: any,
  ): Promise<void> {
    const conn = await this.prisma.ecommerceConnection.findUnique({
      where: { id: connectionId },
    });
    if (!conn || !conn.isActive) return;

    if (conn.webhookSecret) {
      this.validateShopifyHmac(rawBody, hmacHeader, conn.webhookSecret);
    }

    this.logger.log(`Shopify webhook: ${topic} on connection ${connectionId}`);

    await this.dispatchShopifyEvent(conn, topic, payload);
  }

  async handleWooCommerceWebhook(
    connectionId: string,
    topic: string,
    rawBody: Buffer,
    signatureHeader: string,
    payload: any,
  ): Promise<void> {
    const conn = await this.prisma.ecommerceConnection.findUnique({
      where: { id: connectionId },
    });
    if (!conn || !conn.isActive) return;

    if (conn.webhookSecret) {
      this.validateWooCommerceSignature(rawBody, signatureHeader, conn.webhookSecret);
    }

    this.logger.log(`WooCommerce webhook: ${topic} on connection ${connectionId}`);

    await this.dispatchWooCommerceEvent(conn, topic, payload);
  }

  async registerWebhooksForConnection(connectionId: string, baseUrl: string): Promise<void> {
    const conn = await this.prisma.ecommerceConnection.findUnique({
      where: { id: connectionId },
    });
    if (!conn) return;

    await this.prisma.registeredWebhook.deleteMany({ where: { connectionId } });

    const driver = this.integrationService.buildDriver(conn);
    const results = await driver.registerWebhooks(baseUrl, connectionId);

    for (const wh of results) {
      await this.prisma.registeredWebhook.create({
        data: {
          connectionId,
          topic: wh.topic,
          externalId: wh.externalId,
          callbackUrl: wh.callbackUrl,
        },
      });
    }

    this.logger.log(`Registered ${results.length} webhooks for connection ${connectionId}`);
  }

  private async dispatchShopifyEvent(conn: any, topic: string, payload: any): Promise<void> {
    if (topic.startsWith('orders/')) {
      const externalId = String(payload.id);
      await this.prisma.ecommerceOrder.upsert({
        where: { connectionId_externalId: { connectionId: conn.id, externalId } },
        create: {
          connectionId: conn.id,
          tenantId: conn.tenantId,
          externalId,
          externalNumber: String(payload.order_number ?? ''),
          platform: 'SHOPIFY',
          status: 'PENDING',
          rawData: payload,
        },
        update: { rawData: payload, updatedAt: new Date() },
      });

      if (conn.autoCreateSale) {
        const ecomOrder = await this.prisma.ecommerceOrder.findFirst({
          where: { connectionId: conn.id, externalId },
        });
        if (ecomOrder) {
          await this.orderSyncService.processOrder(ecomOrder.id);
        }
      }
    }

    if (topic === 'inventory_levels/update') {
      const inventoryItemId = String(payload.inventory_item_id);
      const mapping = await this.prisma.productMapping.findFirst({
        where: { connectionId: conn.id, externalVariantId: inventoryItemId },
      });
      if (mapping) {
        this.logger.log(`Inventory update from Shopify for product ${mapping.nexoposProductId}`);
      }
    }
  }

  private async dispatchWooCommerceEvent(conn: any, topic: string, payload: any): Promise<void> {
    if (topic.startsWith('order.')) {
      const externalId = String(payload.id);
      await this.prisma.ecommerceOrder.upsert({
        where: { connectionId_externalId: { connectionId: conn.id, externalId } },
        create: {
          connectionId: conn.id,
          tenantId: conn.tenantId,
          externalId,
          externalNumber: payload.number,
          platform: 'WOOCOMMERCE',
          status: 'PENDING',
          rawData: payload,
        },
        update: { rawData: payload, updatedAt: new Date() },
      });

      if (conn.autoCreateSale && topic === 'order.created') {
        const ecomOrder = await this.prisma.ecommerceOrder.findFirst({
          where: { connectionId: conn.id, externalId },
        });
        if (ecomOrder) {
          await this.orderSyncService.processOrder(ecomOrder.id);
        }
      }
    }
  }
}
