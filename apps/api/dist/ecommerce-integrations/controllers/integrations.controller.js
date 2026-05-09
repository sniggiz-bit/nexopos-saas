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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const integration_service_1 = require("../services/integration.service");
const product_sync_service_1 = require("../services/product-sync.service");
const inventory_sync_service_1 = require("../services/inventory-sync.service");
const order_sync_service_1 = require("../services/order-sync.service");
const webhook_service_1 = require("../services/webhook.service");
const create_connection_dto_1 = require("../dto/create-connection.dto");
const update_connection_dto_1 = require("../dto/update-connection.dto");
let IntegrationsController = class IntegrationsController {
    integrationService;
    productSyncService;
    inventorySyncService;
    orderSyncService;
    webhookService;
    constructor(integrationService, productSyncService, inventorySyncService, orderSyncService, webhookService) {
        this.integrationService = integrationService;
        this.productSyncService = productSyncService;
        this.inventorySyncService = inventorySyncService;
        this.orderSyncService = orderSyncService;
        this.webhookService = webhookService;
    }
    create(req, dto) {
        return this.integrationService.create(req.user.tenantId, dto);
    }
    findAll(req) {
        return this.integrationService.findAll(req.user.tenantId);
    }
    findOne(req, id) {
        return this.integrationService.findOne(id, req.user.tenantId);
    }
    update(req, id, dto) {
        return this.integrationService.update(id, req.user.tenantId, dto);
    }
    remove(req, id) {
        return this.integrationService.remove(id, req.user.tenantId);
    }
    testConnection(req, id) {
        return this.integrationService.testConnection(id, req.user.tenantId);
    }
    async syncProducts(req, id) {
        await this.integrationService.findOne(id, req.user.tenantId);
        this.productSyncService.syncProducts(id);
        return { message: 'Sincronización de productos iniciada' };
    }
    async syncInventory(req, id) {
        await this.integrationService.findOne(id, req.user.tenantId);
        this.inventorySyncService.syncInventory(id);
        return { message: 'Sincronización de inventario iniciada' };
    }
    async syncOrders(req, id) {
        await this.integrationService.findOne(id, req.user.tenantId);
        this.orderSyncService.pullOrders(id);
        return { message: 'Importación de pedidos iniciada' };
    }
    async syncFull(req, id) {
        await this.integrationService.findOne(id, req.user.tenantId);
        this.productSyncService.syncProducts(id);
        this.inventorySyncService.syncInventory(id);
        this.orderSyncService.pullOrders(id);
        return { message: 'Sincronización completa iniciada' };
    }
    async registerWebhooks(req, id, baseUrl) {
        await this.integrationService.findOne(id, req.user.tenantId);
        const url = baseUrl ?? process.env.API_PUBLIC_URL ?? 'https://nexopos.cl/api';
        await this.webhookService.registerWebhooksForConnection(id, url);
        return { message: 'Webhooks registrados' };
    }
    getMappings(req, id) {
        return this.integrationService.getMappings(id, req.user.tenantId);
    }
    deleteMapping(req, id, mappingId) {
        return this.integrationService.deleteMapping(id, mappingId, req.user.tenantId);
    }
    getOrders(req, connectionId) {
        return this.integrationService.getOrders(req.user.tenantId, connectionId);
    }
    processOrder(id) {
        return this.orderSyncService.processOrder(id);
    }
    getLogs(req, connectionId) {
        return this.integrationService.getLogs(req.user.tenantId, connectionId);
    }
};
exports.IntegrationsController = IntegrationsController;
__decorate([
    (0, common_1.Post)('connections'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_connection_dto_1.CreateConnectionDto]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('connections'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('connections/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('connections/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_connection_dto_1.UpdateConnectionDto]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('connections/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('connections/:id/test'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Post)('connections/:id/sync/products'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "syncProducts", null);
__decorate([
    (0, common_1.Post)('connections/:id/sync/inventory'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "syncInventory", null);
__decorate([
    (0, common_1.Post)('connections/:id/sync/orders'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "syncOrders", null);
__decorate([
    (0, common_1.Post)('connections/:id/sync/full'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "syncFull", null);
__decorate([
    (0, common_1.Post)('connections/:id/webhooks/register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('baseUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "registerWebhooks", null);
__decorate([
    (0, common_1.Get)('connections/:id/mappings'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "getMappings", null);
__decorate([
    (0, common_1.Delete)('connections/:id/mappings/:mappingId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('mappingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "deleteMapping", null);
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('connectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Post)('orders/:id/process'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "processOrder", null);
__decorate([
    (0, common_1.Get)('logs'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('connectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "getLogs", null);
exports.IntegrationsController = IntegrationsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('integrations'),
    __metadata("design:paramtypes", [integration_service_1.IntegrationService,
        product_sync_service_1.ProductSyncService,
        inventory_sync_service_1.InventorySyncService,
        order_sync_service_1.OrderSyncService,
        webhook_service_1.WebhookService])
], IntegrationsController);
//# sourceMappingURL=integrations.controller.js.map