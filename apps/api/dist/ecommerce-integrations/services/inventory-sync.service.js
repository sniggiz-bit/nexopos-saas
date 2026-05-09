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
var InventorySyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventorySyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const integration_service_1 = require("./integration.service");
let InventorySyncService = InventorySyncService_1 = class InventorySyncService {
    prisma;
    integrationService;
    logger = new common_1.Logger(InventorySyncService_1.name);
    constructor(prisma, integrationService) {
        this.prisma = prisma;
        this.integrationService = integrationService;
    }
    async syncInventory(connectionId) {
        const conn = await this.prisma.ecommerceConnection.findUnique({
            where: { id: connectionId },
        });
        if (!conn || !conn.isActive || !conn.syncInventory)
            return;
        const startedAt = Date.now();
        let total = 0, synced = 0, failed = 0;
        const errors = [];
        try {
            const driver = this.integrationService.buildDriver(conn);
            const mappings = await this.prisma.productMapping.findMany({
                where: { connectionId },
                include: {
                    product: {
                        include: { inventory: true },
                    },
                },
            });
            total = mappings.length;
            for (const mapping of mappings) {
                const stock = mapping.product.inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);
                try {
                    const result = await driver.setInventoryLevel({
                        externalId: mapping.externalId,
                        externalVariantId: mapping.externalVariantId ?? undefined,
                        stock,
                    });
                    if (result.success) {
                        await this.prisma.productMapping.update({
                            where: { id: mapping.id },
                            data: { lastPushedAt: new Date() },
                        });
                        synced++;
                    }
                    else {
                        failed++;
                        errors.push({ mappingId: mapping.id, error: result.error });
                    }
                }
                catch (err) {
                    failed++;
                    errors.push({ mappingId: mapping.id, error: err.message });
                }
            }
        }
        catch (err) {
            this.logger.error(`syncInventory fatal for ${connectionId}: ${err.message}`);
            failed = total;
        }
        finally {
            await this.prisma.syncLog.create({
                data: {
                    connectionId,
                    tenantId: conn.tenantId,
                    entityType: 'INVENTORY',
                    direction: 'PUSH',
                    status: failed > 0 && synced === 0 ? 'ERROR' : failed > 0 ? 'PARTIAL' : 'SUCCESS',
                    total,
                    synced,
                    failed,
                    errors: errors.length > 0 ? errors : undefined,
                    durationMs: Date.now() - startedAt,
                    completedAt: new Date(),
                },
            });
        }
    }
    async syncAllActiveConnections() {
        const connections = await this.prisma.ecommerceConnection.findMany({
            where: { isActive: true, syncInventory: true },
            select: { id: true },
        });
        for (const conn of connections) {
            await this.syncInventory(conn.id).catch((e) => this.logger.error(`syncInventory failed for ${conn.id}: ${e.message}`));
        }
    }
    async pushStockForProduct(nexoposProductId) {
        const mappings = await this.prisma.productMapping.findMany({
            where: { nexoposProductId },
            include: {
                connection: true,
                product: { include: { inventory: true } },
            },
        });
        for (const mapping of mappings) {
            if (!mapping.connection.isActive || !mapping.connection.syncInventory)
                continue;
            const stock = mapping.product.inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);
            try {
                const driver = this.integrationService.buildDriver(mapping.connection);
                await driver.setInventoryLevel({
                    externalId: mapping.externalId,
                    externalVariantId: mapping.externalVariantId ?? undefined,
                    stock,
                });
            }
            catch (err) {
                this.logger.error(`pushStockForProduct failed for mapping ${mapping.id}: ${err.message}`);
            }
        }
    }
};
exports.InventorySyncService = InventorySyncService;
exports.InventorySyncService = InventorySyncService = InventorySyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        integration_service_1.IntegrationService])
], InventorySyncService);
//# sourceMappingURL=inventory-sync.service.js.map