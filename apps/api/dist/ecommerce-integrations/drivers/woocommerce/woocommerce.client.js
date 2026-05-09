"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WooCommerceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("@nestjs/common");
class WooCommerceClient {
    http;
    logger = new common_1.Logger(WooCommerceClient.name);
    constructor(siteUrl, consumerKey, consumerSecret) {
        const baseURL = `${siteUrl.replace(/\/$/, '')}/wp-json/wc/v3`;
        this.http = axios_1.default.create({
            baseURL,
            auth: { username: consumerKey, password: consumerSecret },
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
        });
    }
    async testConnection() {
        try {
            await this.http.get('/system_status');
            return true;
        }
        catch {
            return false;
        }
    }
    async createProduct(data) {
        const res = await this.http.post('/products', data);
        return res.data;
    }
    async updateProduct(productId, data) {
        const res = await this.http.put(`/products/${productId}`, data);
        return res.data;
    }
    async getOrders(since, page = 1) {
        const params = { per_page: 100, page };
        if (since)
            params.after = since.toISOString();
        const res = await this.http.get('/orders', { params });
        return res.data;
    }
    async createWebhook(topic, deliveryUrl, secret) {
        const res = await this.http.post('/webhooks', {
            name: `NexoPOS - ${topic}`,
            topic,
            delivery_url: deliveryUrl,
            secret,
            status: 'active',
        });
        return res.data;
    }
    async deleteWebhook(webhookId) {
        await this.http.delete(`/webhooks/${webhookId}?force=true`);
    }
    async getWebhooks() {
        const res = await this.http.get('/webhooks', { params: { per_page: 100 } });
        return res.data;
    }
}
exports.WooCommerceClient = WooCommerceClient;
//# sourceMappingURL=woocommerce.client.js.map