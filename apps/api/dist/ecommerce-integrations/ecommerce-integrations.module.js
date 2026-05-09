"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcommerceIntegrationsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const integration_service_1 = require("./services/integration.service");
const product_sync_service_1 = require("./services/product-sync.service");
const inventory_sync_service_1 = require("./services/inventory-sync.service");
const order_sync_service_1 = require("./services/order-sync.service");
const webhook_service_1 = require("./services/webhook.service");
const integrations_controller_1 = require("./controllers/integrations.controller");
const webhooks_controller_1 = require("./controllers/webhooks.controller");
const sync_products_job_1 = require("./jobs/sync-products.job");
const sync_inventory_job_1 = require("./jobs/sync-inventory.job");
const pull_orders_job_1 = require("./jobs/pull-orders.job");
let EcommerceIntegrationsModule = class EcommerceIntegrationsModule {
};
exports.EcommerceIntegrationsModule = EcommerceIntegrationsModule;
exports.EcommerceIntegrationsModule = EcommerceIntegrationsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [integrations_controller_1.IntegrationsController, webhooks_controller_1.WebhooksController],
        providers: [
            integration_service_1.IntegrationService,
            product_sync_service_1.ProductSyncService,
            inventory_sync_service_1.InventorySyncService,
            order_sync_service_1.OrderSyncService,
            webhook_service_1.WebhookService,
            sync_products_job_1.SyncProductsJob,
            sync_inventory_job_1.SyncInventoryJob,
            pull_orders_job_1.PullOrdersJob,
        ],
        exports: [integration_service_1.IntegrationService, inventory_sync_service_1.InventorySyncService],
    })
], EcommerceIntegrationsModule);
//# sourceMappingURL=ecommerce-integrations.module.js.map