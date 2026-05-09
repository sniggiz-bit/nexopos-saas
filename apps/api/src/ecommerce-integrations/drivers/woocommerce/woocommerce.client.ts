import axios, { AxiosInstance } from 'axios';
import { Logger } from '@nestjs/common';
import { WooOrder, WooProduct, WooWebhook } from './woocommerce.types';

export class WooCommerceClient {
  private readonly http: AxiosInstance;
  private readonly logger = new Logger(WooCommerceClient.name);

  constructor(siteUrl: string, consumerKey: string, consumerSecret: string) {
    const baseURL = `${siteUrl.replace(/\/$/, '')}/wp-json/wc/v3`;

    this.http = axios.create({
      baseURL,
      auth: { username: consumerKey, password: consumerSecret },
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.http.get('/system_status');
      return true;
    } catch {
      return false;
    }
  }

  async createProduct(data: Partial<WooProduct>): Promise<WooProduct> {
    const res = await this.http.post('/products', data);
    return res.data;
  }

  async updateProduct(productId: string, data: Partial<WooProduct>): Promise<WooProduct> {
    const res = await this.http.put(`/products/${productId}`, data);
    return res.data;
  }

  async getOrders(since?: Date, page = 1): Promise<WooOrder[]> {
    const params: Record<string, any> = { per_page: 100, page };
    if (since) params.after = since.toISOString();

    const res = await this.http.get('/orders', { params });
    return res.data;
  }

  async createWebhook(topic: string, deliveryUrl: string, secret: string): Promise<WooWebhook> {
    const res = await this.http.post('/webhooks', {
      name: `NexoPOS - ${topic}`,
      topic,
      delivery_url: deliveryUrl,
      secret,
      status: 'active',
    });
    return res.data;
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await this.http.delete(`/webhooks/${webhookId}?force=true`);
  }

  async getWebhooks(): Promise<WooWebhook[]> {
    const res = await this.http.get('/webhooks', { params: { per_page: 100 } });
    return res.data;
  }
}
