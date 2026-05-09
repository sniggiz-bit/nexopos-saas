"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WooCommerceDriver = void 0;
const common_1 = require("@nestjs/common");
const woocommerce_client_1 = require("./woocommerce.client");
const WEBHOOK_TOPICS = [
    'order.created',
    'order.updated',
    'product.updated',
    'product.deleted',
];
class WooCommerceDriver {
    client;
    logger = new common_1.Logger(WooCommerceDriver.name);
    webhookSecret;
    constructor(siteUrl, consumerKey, consumerSecret, webhookSecret) {
        this.client = new woocommerce_client_1.WooCommerceClient(siteUrl, consumerKey, consumerSecret);
        this.webhookSecret = webhookSecret ?? 'nexopos-woo-secret';
    }
    async testConnection() {
        return this.client.testConnection();
    }
    async pushProduct(payload) {
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
                images: payload.imageUrl ? [{ src: payload.imageUrl }] : [],
            });
            return { success: true, externalId: String(product.id) };
        }
        catch (error) {
            this.logger.error(`pushProduct failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async updateProduct(externalId, payload) {
        try {
            const data = {};
            if (payload.name !== undefined)
                data.name = payload.name;
            if (payload.price !== undefined)
                data.regular_price = String(payload.price / 100);
            if (payload.description !== undefined)
                data.description = payload.description;
            await this.client.updateProduct(externalId, data);
            return { success: true, externalId };
        }
        catch (error) {
            this.logger.error(`updateProduct failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async setInventoryLevel(payload) {
        try {
            await this.client.updateProduct(payload.externalId, {
                stock_quantity: payload.stock,
                manage_stock: true,
            });
            return { success: true, externalId: payload.externalId };
        }
        catch (error) {
            this.logger.error(`setInventoryLevel failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async pullOrders(since) {
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
                rawData: o,
            }));
        }
        catch (error) {
            this.logger.error(`pullOrders failed: ${error.message}`);
            return [];
        }
    }
    async registerWebhooks(baseUrl, connectionId) {
        const results = [];
        for (const topic of WEBHOOK_TOPICS) {
            try {
                const callbackUrl = `${baseUrl}/webhooks/woocommerce/${connectionId}`;
                const wh = await this.client.createWebhook(topic, callbackUrl, this.webhookSecret);
                results.push({ topic, externalId: String(wh.id), callbackUrl });
            }
            catch (error) {
                this.logger.warn(`Failed to register webhook ${topic}: ${error.message}`);
            }
        }
        return results;
    }
    async unregisterWebhook(externalWebhookId) {
        await this.client.deleteWebhook(externalWebhookId);
    }
}
exports.WooCommerceDriver = WooCommerceDriver;
//# sourceMappingURL=woocommerce.driver.js.map