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
var OrderSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderSyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const integration_service_1 = require("./integration.service");
let OrderSyncService = OrderSyncService_1 = class OrderSyncService {
    prisma;
    integrationService;
    logger = new common_1.Logger(OrderSyncService_1.name);
    constructor(prisma, integrationService) {
        this.prisma = prisma;
        this.integrationService = integrationService;
    }
    async pullOrders(connectionId) {
        const conn = await this.prisma.ecommerceConnection.findUnique({
            where: { id: connectionId },
        });
        if (!conn || !conn.isActive || !conn.syncOrders)
            return;
        const startedAt = Date.now();
        let synced = 0, failed = 0;
        const errors = [];
        try {
            const driver = this.integrationService.buildDriver(conn);
            const since = conn.lastSyncAt ?? undefined;
            const orders = await driver.pullOrders(since);
            for (const order of orders) {
                try {
                    await this.prisma.ecommerceOrder.upsert({
                        where: {
                            connectionId_externalId: {
                                connectionId,
                                externalId: order.externalId,
                            },
                        },
                        create: {
                            connectionId,
                            tenantId: conn.tenantId,
                            externalId: order.externalId,
                            externalNumber: order.externalNumber,
                            platform: conn.platform,
                            status: 'PENDING',
                            rawData: order.rawData,
                        },
                        update: {
                            rawData: order.rawData,
                            updatedAt: new Date(),
                        },
                    });
                    synced++;
                }
                catch (err) {
                    failed++;
                    errors.push({ orderId: order.externalId, error: err.message });
                }
            }
            await this.prisma.ecommerceConnection.update({
                where: { id: connectionId },
                data: { lastSyncAt: new Date() },
            });
        }
        catch (err) {
            this.logger.error(`pullOrders fatal for ${connectionId}: ${err.message}`);
        }
        finally {
            await this.prisma.syncLog.create({
                data: {
                    connectionId,
                    tenantId: conn.tenantId,
                    entityType: 'ORDER',
                    direction: 'PULL',
                    status: failed > 0 && synced === 0 ? 'ERROR' : failed > 0 ? 'PARTIAL' : 'SUCCESS',
                    total: synced + failed,
                    synced,
                    failed,
                    errors: errors.length > 0 ? errors : undefined,
                    durationMs: Date.now() - startedAt,
                    completedAt: new Date(),
                },
            });
        }
    }
    async processOrder(ecommerceOrderId) {
        const ecommerceOrder = await this.prisma.ecommerceOrder.findUnique({
            where: { id: ecommerceOrderId },
            include: { connection: true },
        });
        if (!ecommerceOrder)
            return { message: 'Orden no encontrada' };
        if (ecommerceOrder.status === 'COMPLETED')
            return { message: 'Orden ya procesada' };
        try {
            await this.prisma.ecommerceOrder.update({
                where: { id: ecommerceOrderId },
                data: { status: 'PROCESSING' },
            });
            const rawData = ecommerceOrder.rawData;
            const tenantId = ecommerceOrder.tenantId;
            const branch = await this.prisma.branch.findFirst({
                where: { tenantId, isMain: true },
            });
            if (!branch)
                throw new Error('Sucursal principal no encontrada');
            const lineItems = rawData.line_items ?? rawData.lineItems ?? [];
            const saleItems = [];
            for (const li of lineItems) {
                const externalProductId = String(li.product_id ?? li.product_id ?? '');
                const mapping = await this.prisma.productMapping.findFirst({
                    where: {
                        connectionId: ecommerceOrder.connectionId,
                        externalId: externalProductId,
                    },
                });
                if (mapping) {
                    saleItems.push({
                        productId: mapping.nexoposProductId,
                        quantity: li.quantity,
                        price: typeof li.price === 'string' ? parseFloat(li.price) * 100 : li.price,
                    });
                }
                else {
                    this.logger.warn(`No se encontró mapeo para producto externo ${externalProductId} en orden ${ecommerceOrderId}`);
                }
            }
            if (saleItems.length === 0) {
                await this.prisma.ecommerceOrder.update({
                    where: { id: ecommerceOrderId },
                    data: {
                        status: 'IGNORED',
                        errorMessage: 'No hay productos mapeados en esta orden',
                    },
                });
                return { message: 'Orden ignorada: sin productos mapeados' };
            }
            const total = saleItems.reduce((s, i) => s + i.price * i.quantity, 0);
            const sale = await this.prisma.sale.create({
                data: {
                    tenantId,
                    branchId: branch.id,
                    total,
                    status: 'COMPLETED',
                    items: {
                        create: saleItems.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                        })),
                    },
                    payments: {
                        create: [{ amount: total, paymentMethod: 'TRANSFERENCIA' }],
                    },
                },
            });
            await this.prisma.ecommerceOrder.update({
                where: { id: ecommerceOrderId },
                data: {
                    status: 'COMPLETED',
                    saleId: sale.id,
                    processedAt: new Date(),
                },
            });
            return { saleId: sale.id, message: 'Orden procesada correctamente' };
        }
        catch (err) {
            this.logger.error(`processOrder failed for ${ecommerceOrderId}: ${err.message}`);
            await this.prisma.ecommerceOrder.update({
                where: { id: ecommerceOrderId },
                data: { status: 'FAILED', errorMessage: err.message },
            });
            return { message: `Error: ${err.message}` };
        }
    }
    async pullAllActiveConnections() {
        const connections = await this.prisma.ecommerceConnection.findMany({
            where: { isActive: true, syncOrders: true },
            select: { id: true },
        });
        for (const conn of connections) {
            await this.pullOrders(conn.id).catch((e) => this.logger.error(`pullOrders failed for ${conn.id}: ${e.message}`));
        }
    }
};
exports.OrderSyncService = OrderSyncService;
exports.OrderSyncService = OrderSyncService = OrderSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        integration_service_1.IntegrationService])
], OrderSyncService);
//# sourceMappingURL=order-sync.service.js.map