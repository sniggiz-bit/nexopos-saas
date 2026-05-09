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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const webhook_service_1 = require("../services/webhook.service");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    webhookService;
    logger = new common_1.Logger(WebhooksController_1.name);
    constructor(webhookService) {
        this.webhookService = webhookService;
    }
    async shopifyWebhook(connectionId, topic, hmac, req) {
        const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
        const payload = req.body;
        this.logger.log(`Shopify webhook received: ${topic} for ${connectionId}`);
        this.webhookService
            .handleShopifyWebhook(connectionId, topic, rawBody, hmac ?? '', payload)
            .catch((e) => this.logger.error(`Shopify webhook error: ${e.message}`));
        return { received: true };
    }
    async wooCommerceWebhook(connectionId, topic, signature, req) {
        const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
        const payload = req.body;
        this.logger.log(`WooCommerce webhook received: ${topic} for ${connectionId}`);
        this.webhookService
            .handleWooCommerceWebhook(connectionId, topic, rawBody, signature ?? '', payload)
            .catch((e) => this.logger.error(`WooCommerce webhook error: ${e.message}`));
        return { received: true };
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('shopify/:connectionId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('connectionId')),
    __param(1, (0, common_1.Headers)('x-shopify-topic')),
    __param(2, (0, common_1.Headers)('x-shopify-hmac-sha256')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "shopifyWebhook", null);
__decorate([
    (0, common_1.Post)('woocommerce/:connectionId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('connectionId')),
    __param(1, (0, common_1.Headers)('x-wc-webhook-topic')),
    __param(2, (0, common_1.Headers)('x-wc-webhook-signature')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "wooCommerceWebhook", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhook_service_1.WebhookService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map