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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StoreService = class StoreService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findBySlug(slug) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { storeSlug: slug },
            select: {
                id: true,
                name: true,
                storeSlug: true,
                storeSettings: true,
                branches: {
                    where: { isMain: true },
                    take: 1,
                    select: { id: true },
                },
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Store not found');
        }
        const settings = tenant.storeSettings;
        if (!settings?.isActive) {
            throw new common_1.NotFoundException('Store is not active');
        }
        return {
            ...tenant,
            mainBranchId: tenant.branches[0]?.id,
        };
    }
    async findProductsBySlug(slug, search) {
        const tenant = await this.findBySlug(slug);
        return this.prisma.product.findMany({
            where: {
                tenantId: tenant.id,
                isPublic: true,
                isActive: true,
                OR: search
                    ? [
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                    ]
                    : undefined,
            },
            select: {
                id: true,
                name: true,
                price: true,
                description: true,
                image: true,
                category: {
                    select: { name: true },
                },
            },
        });
    }
    async updateStoreSettings(tenantId, settings) {
        if (settings.storeSlug) {
            const existing = await this.prisma.tenant.findUnique({
                where: { storeSlug: settings.storeSlug },
            });
            if (existing && existing.id !== tenantId) {
                throw new Error('Slug already taken');
            }
        }
        return this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                storeSlug: settings.storeSlug,
                storeSettings: settings.storeSettings,
            },
        });
    }
    async getSettings(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                storeSlug: true,
                storeSettings: true,
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
};
exports.StoreService = StoreService;
exports.StoreService = StoreService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StoreService);
//# sourceMappingURL=store.service.js.map