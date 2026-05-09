"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const integration_service_1 = require("./integration.service");
const order_sync_service_1 = require("./order-sync.service");
const inventory_sync_service_1 = require("./inventory-sync.service");
let WebhookService = WebhookService_1 = class WebhookService {
    prisma;
    integrationService;
    orderSyncService;
    inventorySyncService;
    logger = new common_1.Logger(WebhookService_1.name);
    constructor(prisma, integrationService, orderSyncService, inventorySyncService) {
        this.prisma = prisma;
        this.integrationService = integrationService;
        this.orderSyncService = orderSyncService;
        this.inventorySyncService = inventorySyncService;
    }
    validateShopifyHmac(rawBody, hmacHeader, secret) {
        const digest = (0, crypto_1.createHmac)('sha256', secret)
            .update(rawBody)
            .digest('base64');
        const digestBuf = Buffer.from(digest);
        const headerBuf = Buffer.from(hmacHeader);
        if (digestBuf.length !== headerBuf.length || !(0, crypto_1.timingSafeEqual)(digestBuf, headerBuf)) {
            throw new common_1.UnauthorizedException('HMAC de Shopify inválido');
        }
    }
    validateWooCommerceSignature(rawBody, signatureHeader, secret) {
        const digest = (0, crypto_1.createHmac)('sha256', secret)
            .update(rawBody)
            .digest('base64');
        const digestBuf = Buffer.from(digest);
        const headerBuf = Buffer.from(signatureHeader);
        if (digestBuf.length !== headerBuf.length || !(0, crypto_1.timingSafeEqual)(digestBuf, headerBuf)) {
            throw new common_1.UnauthorizedException('Firma de WooCommerce inválida');
        }
    }
    async handleShopifyWebhook(connectionId, topic, rawBody, hmacHeader, payload) {
        const conn = await this.prisma.ecommerceConnection.findUnique({
            where: { id: connectionId },
        });
        if (!conn || !conn.isActive)
            return;
        if (conn.webhookSecret) {
            this.validateShopifyHmac(rawBody, hmacHeader, conn.webhookSecret);
        }
        this.logger.log(`Shopify webhook: ${topic} on connection ${connectionId}`);
        await this.dispatchShopifyEvent(conn, topic, payload);
    }
    async handleWooCommerceWebhook(connectionId, topic, rawBody, signatureHeader, payload) {
        const conn = await this.prisma.ecommerceConnection.findUnique({
            where: { id: connectionId },
        });
        if (!conn || !conn.isActive)
            return;
        if (conn.webhookSecret) {
            this.validateWooCommerceSignature(rawBody, signatureHeader, conn.webhookSecret);
        }
        this.logger.log(`WooCommerce webhook: ${topic} on connection ${connectionId}`);
        await this.dispatchWooCommerceEvent(conn, topic, payload);
    }
    async registerWebhooksForConnection(connectionId, baseUrl) {
        const conn = await this.prisma.ecommerceConnection.findUnique({
            where: { id: connectionId },
        });
        if (!conn)
            return;
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
    async dispatchShopifyEvent(conn, topic, payload) {
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
    async dispatchWooCommerceEvent(conn, topic, payload) {
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
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = WebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        integration_service_1.IntegrationService,
        order_sync_service_1.OrderSyncService,
        inventory_sync_service_1.InventorySyncService])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map