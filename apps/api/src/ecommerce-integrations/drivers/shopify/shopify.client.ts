import axios, { AxiosInstance, AxiosError } from 'axios';
import { Logger } from '@nestjs/common';
import {
  ShopifyProduct,
  ShopifyOrder,
  ShopifyInventoryLevel,
  ShopifyLocation,
  ShopifyWebhook,
} from './shopify.types';

export class ShopifyClient {
  private readonly http: AxiosInstance;
  private readonly logger = new Logger(ShopifyClient.name);
  private readonly apiVersion = '2024-01';

  constructor(shopDomain: string, accessToken: string) {
    this.http = axios.create({
      baseURL: `https://${shopDomain}/admin/api/${this.apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    this.http.interceptors.response.use(
      (r) => r,
      async (error: AxiosError) => {
        if (error.response?.status === 429) {
          const retryAfter = Number(error.response.headers['retry-after'] || 2);
          this.logger.warn(`Shopify rate limit hit, retrying after ${retryAfter}s`);
          await this.sleep(retryAfter * 1000);
          return this.http.request(error.config!);
        }
        return Promise.reject(error);
      },
    );
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.http.get('/shop.json');
      return true;
    } catch {
      return false;
    }
  }

  async createProduct(data: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
    const res = await this.http.post('/products.json', { product: data });
    return res.data.product;
  }

  async updateProduct(productId: string, data: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
    const res = await this.http.put(`/products/${productId}.json`, { product: data });
    return res.data.product;
  }

  async getInventoryLevels(inventoryItemId: string, locationId: string): Promise<ShopifyInventoryLevel[]> {
    const res = await this.http.get('/inventory_levels.json', {
      params: { inventory_item_ids: inventoryItemId, location_ids: locationId },
    });
    return res.data.inventory_levels;
  }

  async setInventoryLevel(locationId: string, inventoryItemId: string, available: number): Promise<void> {
    await this.http.post('/inventory_levels/set.json', {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available,
    });
  }

  async getOrders(since?: Date, status = 'any'): Promise<ShopifyOrder[]> {
    const params: Record<string, any> = { status, limit: 250 };
    if (since) params.created_at_min = since.toISOString();

    const res = await this.http.get('/orders.json', { params });
    return res.data.orders;
  }

  async getLocations(): Promise<ShopifyLocation[]> {
    const res = await this.http.get('/locations.json');
    return res.data.locations;
  }

  async createWebhook(topic: string, address: string): Promise<ShopifyWebhook> {
    const res = await this.http.post('/webhooks.json', {
      webhook: { topic, address, format: 'json' },
    });
    return res.data.webhook;
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await this.http.delete(`/webhooks/${webhookId}.json`);
  }

  async getWebhooks(): Promise<ShopifyWebhook[]> {
    const res = await this.http.get('/webhooks.json');
    return res.data.webhooks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
