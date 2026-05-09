import { Logger } from '@nestjs/common';
import { ShopifyClient } from './shopify.client';
import {
  EcommerceDriverInterface,
  ExternalOrder,
  InventorySyncPayload,
  SyncProductPayload,
  SyncResult,
  WebhookRegistrationResult,
} from '../../interfaces/ecommerce-driver.interface';

const WEBHOOK_TOPICS = [
  'orders/create',
  'orders/updated',
  'orders/paid',
  'products/update',
  'products/delete',
];

export class ShopifyDriver implements EcommerceDriverInterface {
  private readonly client: ShopifyClient;
  private readonly logger = new Logger(ShopifyDriver.name);
  private readonly locationId: string;

  constructor(shopDomain: string, accessToken: string, locationId?: string) {
    this.client = new ShopifyClient(shopDomain, accessToken);
    this.locationId = locationId ?? '';
  }

  async testConnection(): Promise<boolean> {
    return this.client.testConnection();
  }

  async pushProduct(payload: SyncProductPayload): Promise<SyncResult> {
    try {
      const product = await this.client.createProduct({
        title: payload.name,
        status: 'active',
        variants: [
          {
            sku: payload.sku,
            price: String(payload.price / 100),
            inventory_management: 'shopify',
            inventory_quantity: payload.stock,
          } as any,
        ],
        images: payload.imageUrl ? [{ src: payload.imageUrl } as any] : [],
        body_html: payload.description,
      });

      const variantId = String(product.variants[0]?.id);

      if (this.locationId && product.variants[0]?.inventory_item_id) {
        await this.client.setInventoryLevel(
          this.locationId,
          String(product.variants[0].inventory_item_id),
          payload.stock,
        );
      }

      return {
        success: true,
        externalId: String(product.id),
        externalVariantId: variantId,
      };
    } catch (error: any) {
      this.logger.error(`pushProduct failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async updateProduct(externalId: string, payload: Partial<SyncProductPayload>): Promise<SyncResult> {
    try {
      await this.client.updateProduct(externalId, {
        title: payload.name,
        body_html: payload.description,
        variants: payload.price !== undefined
          ? [{ price: String(payload.price / 100) } as any]
          : undefined,
      });
      return { success: true, externalId };
    } catch (error: any) {
      this.logger.error(`updateProduct failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async setInventoryLevel(payload: InventorySyncPayload): Promise<SyncResult> {
    try {
      if (!this.locationId) {
        return { success: false, error: 'locationId not configured' };
      }
      // externalVariantId aquí equivale al inventory_item_id de Shopify
      const inventoryItemId = payload.externalVariantId ?? payload.externalId;
      await this.client.setInventoryLevel(this.locationId, inventoryItemId, payload.stock);
      return { success: true, externalId: payload.externalId };
    } catch (error: any) {
      this.logger.error(`setInventoryLevel failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async pullOrders(since?: Date): Promise<ExternalOrder[]> {
    try {
      const shopifyOrders = await this.client.getOrders(since);
      return shopifyOrders.map((o) => ({
        externalId: String(o.id),
        externalNumber: String(o.order_number),
        status: o.financial_status,
        customer: o.customer
          ? {
              email: o.customer.email,
              name: `${o.customer.first_name ?? ''} ${o.customer.last_name ?? ''}`.trim(),
              phone: o.customer.phone ?? o.billing_address?.phone,
              address: o.billing_address?.address1,
            }
          : undefined,
        items: o.line_items.map((li) => ({
          externalProductId: String(li.product_id ?? ''),
          productName: li.title,
          quantity: li.quantity,
          price: Math.round(parseFloat(li.price) * 100),
        })),
        total: Math.round(parseFloat(o.total_price) * 100),
        currency: o.currency,
        createdAt: o.created_at,
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
        const callbackUrl = `${baseUrl}/webhooks/shopify/${connectionId}`;
        const wh = await this.client.createWebhook(topic, callbackUrl);
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

  async getLocations(): Promise<{ id: string; name: string }[]> {
    const locations = await this.client.getLocations();
    return locations.map((l) => ({ id: String(l.id), name: l.name }));
  }
}
