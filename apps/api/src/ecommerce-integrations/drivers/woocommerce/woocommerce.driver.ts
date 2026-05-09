import { Logger } from '@nestjs/common';
import { WooCommerceClient } from './woocommerce.client';
import {
  EcommerceDriverInterface,
  ExternalOrder,
  InventorySyncPayload,
  SyncProductPayload,
  SyncResult,
  WebhookRegistrationResult,
} from '../../interfaces/ecommerce-driver.interface';

const WEBHOOK_TOPICS = [
  'order.created',
  'order.updated',
  'product.updated',
  'product.deleted',
];

export class WooCommerceDriver implements EcommerceDriverInterface {
  private readonly client: WooCommerceClient;
  private readonly logger = new Logger(WooCommerceDriver.name);
  private readonly webhookSecret: string;

  constructor(siteUrl: string, consumerKey: string, consumerSecret: string, webhookSecret?: string) {
    this.client = new WooCommerceClient(siteUrl, consumerKey, consumerSecret);
    this.webhookSecret = webhookSecret ?? 'nexopos-woo-secret';
  }

  async testConnection(): Promise<boolean> {
    return this.client.testConnection();
  }

  async pushProduct(payload: SyncProductPayload): Promise<SyncResult> {
    try {
      const product = await this.client.createProduct({
        name: payload.name,
        type: 'simple',
        status: 'publish',
        sku: payload.sku,
        regular_price: String(payload.price / 100),
        manage_stock: true,
        stock_quantity: payload.stock,
        description: payload.description,
        images: payload.imageUrl ? [{ src: payload.imageUrl } as any] : [],
      });

      return { success: true, externalId: String(product.id) };
    } catch (error: any) {
      this.logger.error(`pushProduct failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async updateProduct(externalId: string, payload: Partial<SyncProductPayload>): Promise<SyncResult> {
    try {
      const data: Record<string, any> = {};
      if (payload.name !== undefined) data.name = payload.name;
      if (payload.price !== undefined) data.regular_price = String(payload.price / 100);
      if (payload.description !== undefined) data.description = payload.description;

      await this.client.updateProduct(externalId, data);
      return { success: true, externalId };
    } catch (error: any) {
      this.logger.error(`updateProduct failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async setInventoryLevel(payload: InventorySyncPayload): Promise<SyncResult> {
    try {
      await this.client.updateProduct(payload.externalId, {
        stock_quantity: payload.stock,
        manage_stock: true,
      });
      return { success: true, externalId: payload.externalId };
    } catch (error: any) {
      this.logger.error(`setInventoryLevel failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async pullOrders(since?: Date): Promise<ExternalOrder[]> {
    try {
      const wooOrders = await this.client.getOrders(since);
      return wooOrders.map((o) => ({
        externalId: String(o.id),
        externalNumber: o.number,
        status: o.status,
        customer: {
          email: o.billing?.email,
          name: `${o.billing?.first_name ?? ''} ${o.billing?.last_name ?? ''}`.trim(),
          phone: o.billing?.phone,
          address: o.billing?.address_1,
        },
        items: o.line_items.map((li) => ({
          externalProductId: String(li.product_id),
          productName: li.name,
          quantity: li.quantity,
          price: Math.round(li.price * 100),
        })),
        total: Math.round(parseFloat(o.total) * 100),
        currency: o.currency,
        createdAt: o.date_created,
        rawData: o as any,
      }));
    } catch (error: any) {
      this.logger.error(`pullOrders failed: ${error.message}`);
      return [];
    }
  }

  async registerWebhooks(baseUrl: string, connectionId: string): Promise<WebhookRegistrationResult[]> {
    const results: WebhookRegistrationResult[] = [];

    for (const topic of WEBHOOK_TOPICS) {
      try {
        const callbackUrl = `${baseUrl}/webhooks/woocommerce/${connectionId}`;
        const wh = await this.client.createWebhook(topic, callbackUrl, this.webhookSecret);
        results.push({ topic, externalId: String(wh.id), callbackUrl });
      } catch (error: any) {
        this.logger.warn(`Failed to register webhook ${topic}: ${error.message}`);
      }
    }

    return results;
  }

  async unregisterWebhook(externalWebhookId: string): Promise<void> {
    await this.client.deleteWebhook(externalWebhookId);
  }
}
