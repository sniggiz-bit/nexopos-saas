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
var IntegrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const shopify_driver_1 = require("../drivers/shopify/shopify.driver");
const woocommerce_driver_1 = require("../drivers/woocommerce/woocommerce.driver");
let IntegrationService = IntegrationService_1 = class IntegrationService {
    prisma;
    logger = new common_1.Logger(IntegrationService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, dto) {
        return this.prisma.ecommerceConnection.create({
            data: {
                tenantId,
                platform: dto.platform,
                name: dto.name,
                shopDomain: dto.shopDomain,
                accessToken: dto.accessToken,
                locationId: dto.locationId,
                siteUrl: dto.siteUrl,
                consumerKey: dto.consumerKey,
                consumerSecret: dto.consumerSecret,
                syncProducts: dto.syncProducts ?? true,
                syncInventory: dto.syncInventory ?? true,
                syncOrders: dto.syncOrders ?? true,
                syncCustomers: dto.syncCustomers ?? false,
                autoCreateSale: dto.autoCreateSale ?? false,
            },
        });
    }
    async findAll(tenantId) {
        return this.prisma.ecommerceConnection.findMany({
            where: { tenantId },
            select: {
                id: true,
                platform: true,
                name: true,
                isActive: true,
                shopDomain: true,
                siteUrl: true,
                syncProducts: true,
                syncInventory: true,
                syncOrders: true,
                syncCustomers: true,
                autoCreateSale: true,
                locationId: true,
                lastSyncAt: true,
                syncStatus: true,
                lastError: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, tenantId) {
        const conn = await this.prisma.ecommerceConnection.findFirst({
            where: { id, tenantId },
        });
        if (!conn)
            throw new common_1.NotFoundException('Conexión no encontrada');
        return conn;
    }
    async update(id, tenantId, dto) {
        await this.findOne(id, tenantId);
        return this.prisma.ecommerceConnection.update({
            where: { id },
            data: {
                name: dto.name,
                shopDomain: dto.shopDomain,
                accessToken: dto.accessToken,
                locationId: dto.locationId,
                siteUrl: dto.siteUrl,
                consumerKey: dto.consumerKey,
                consumerSecret: dto.consumerSecret,
                syncProducts: dto.syncProducts,
                syncInventory: dto.syncInventory,
                syncOrders: dto.syncOrders,
                syncCustomers: dto.syncCustomers,
                autoCreateSale: dto.autoCreateSale,
                isActive: dto.isActive,
            },
        });
    }
    async remove(id, tenantId) {
        await this.findOne(id, tenantId);
        await this.prisma.ecommerceConnection.delete({ where: { id } });
        return { message: 'Conexión eliminada' };
    }
    async testConnection(id, tenantId) {
        const conn = await this.findOne(id, tenantId);
        const driver = this.buildDriver(conn);
        const ok = await driver.testConnection();
        return { success: ok, message: ok ? 'Conexión exitosa' : 'No se pudo conectar' };
    }
    async getMappings(connectionId, tenantId) {
        await this.findOne(connectionId, tenantId);
        return this.prisma.productMapping.findMany({
            where: { connectionId },
            include: { product: { select: { id: true, name: true, sku: true } } },
        });
    }
    async deleteMapping(connectionId, mappingId, tenantId) {
        await this.findOne(connectionId, tenantId);
        await this.prisma.productMapping.delete({ where: { id: mappingId } });
        return { message: 'Mapeo eliminado' };
    }
    async getLogs(tenantId, connectionId) {
        return this.prisma.syncLog.findMany({
            where: {
                tenantId,
                ...(connectionId ? { connectionId } : {}),
            },
            orderBy: { startedAt: 'desc' },
            take: 100,
        });
    }
    async getOrders(tenantId, connectionId) {
        return this.prisma.ecommerceOrder.findMany({
            where: {
                tenantId,
                ...(connectionId ? { connectionId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    buildDriver(conn) {
        if (conn.platform === 'SHOPIFY') {
            if (!conn.shopDomain || !conn.accessToken) {
                throw new common_1.BadRequestException('Faltan credenciales de Shopify');
            }
            return new shopify_driver_1.ShopifyDriver(conn.shopDomain, conn.accessToken, conn.locationId ?? undefined);
        }
        if (conn.platform === 'WOOCOMMERCE') {
            if (!conn.siteUrl || !conn.consumerKey || !conn.consumerSecret) {
                throw new common_1.BadRequestException('Faltan credenciales de WooCommerce');
            }
            return new woocommerce_driver_1.WooCommerceDriver(conn.siteUrl, conn.consumerKey, conn.consumerSecret, conn.webhookSecret ?? undefined);
        }
        throw new common_1.BadRequestException(`Plataforma no soportada: ${conn.platform}`);
    }
};
exports.IntegrationService = IntegrationService;
exports.IntegrationService = IntegrationService = IntegrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IntegrationService);
//# sourceMappingURL=integration.service.js.map