"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopifyClient = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("@nestjs/common");
class ShopifyClient {
    http;
    logger = new common_1.Logger(ShopifyClient.name);
    apiVersion = '2024-01';
    constructor(shopDomain, accessToken) {
        this.http = axios_1.default.create({
            baseURL: `https://${shopDomain}/admin/api/${this.apiVersion}`,
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });
        this.http.interceptors.response.use((r) => r, async (error) => {
            if (error.response?.status === 429) {
                const retryAfter = Number(error.response.headers['retry-after'] || 2);
                this.logger.warn(`Shopify rate limit hit, retrying after ${retryAfter}s`);
                await this.sleep(retryAfter * 1000);
                return this.http.request(error.config);
            }
            return Promise.reject(error);
        });
    }
    async testConnection() {
        try {
            await this.http.get('/shop.json');
            return true;
        }
        catch {
            return false;
        }
    }
    async createProduct(data) {
        const res = await this.http.post('/products.json', { product: data });
        return res.data.product;
    }
    async updateProduct(productId, data) {
        const res = await this.http.put(`/products/${productId}.json`, { product: data });
        return res.data.product;
    }
    async getInventoryLevels(inventoryItemId, locationId) {
        const res = await this.http.get('/inventory_levels.json', {
            params: { inventory_item_ids: inventoryItemId, location_ids: locationId },
        });
        return res.data.inventory_levels;
    }
    async setInventoryLevel(locationId, inventoryItemId, available) {
        await this.http.post('/inventory_levels/set.json', {
            location_id: locationId,
            inventory_item_id: inventoryItemId,
            available,
        });
    }
    async getOrders(since, status = 'any') {
        const params = { status, limit: 250 };
        if (since)
            params.created_at_min = since.toISOString();
        const res = await this.http.get('/orders.json', { params });
        return res.data.orders;
    }
    async getLocations() {
        const res = await this.http.get('/locations.json');
        return res.data.locations;
    }
    async createWebhook(topic, address) {
        const res = await this.http.post('/webhooks.json', {
            webhook: { topic, address, format: 'json' },
        });
        return res.data.webhook;
    }
    async deleteWebhook(webhookId) {
        await this.http.delete(`/webhooks/${webhookId}.json`);
    }
    async getWebhooks() {
        const res = await this.http.get('/webhooks.json');
        return res.data.webhooks;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.ShopifyClient = ShopifyClient;
//# sourceMappingURL=shopify.client.js.map