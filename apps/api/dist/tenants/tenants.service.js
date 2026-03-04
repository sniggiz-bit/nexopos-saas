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
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TenantsService = class TenantsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createWithDefaults(data) {
        return this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: data.tenant,
            });
            const branch = await tx.branch.create({
                data: {
                    name: 'Casa Matriz',
                    isMain: true,
                    isActive: true,
                    tenantId: tenant.id,
                },
            });
            const user = await tx.user.create({
                data: {
                    ...data.admin,
                    tenantId: tenant.id,
                    branchId: branch.id,
                },
            });
            const settings = await tx.tenantSettings.create({
                data: {
                    tenantId: tenant.id,
                    enableBoletaDte: false,
                    enableFacturaDte: false,
                    enableGuiaDespachoDte: false,
                    enableNotaCreditoDte: false,
                    maxBranches: 1,
                    maxRegisters: 1,
                    maxUsers: 3,
                    canHardDelete: false,
                },
            });
            return { tenant, branch, user, settings };
        });
    }
    async findAll(search) {
        return this.prisma.tenant.findMany({
            where: search
                ? {
                    name: { contains: search, mode: 'insensitive' },
                }
                : {},
            include: {
                plan: true,
                settings: true,
                users: {
                    where: { role: 'TENANT_ADMIN' },
                    take: 1,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: { users: true, branches: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        return this.prisma.tenant.findUnique({
            where: { id },
            include: {
                plan: true,
                branches: true,
                users: true,
                settings: true,
            },
        });
    }
    async updateSettings(tenantId, dto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant)
            throw new common_1.NotFoundException(`Tenant ${tenantId} not found`);
        return this.prisma.tenantSettings.upsert({
            where: { tenantId },
            create: { tenantId, ...dto },
            update: { ...dto },
        });
    }
    async suspend(id) {
        return this.prisma.tenant.update({
            where: { id },
            data: { status: 'SUSPENDED' },
        });
    }
    async activate(id) {
        return this.prisma.tenant.update({
            where: { id },
            data: { status: 'ACTIVE' },
        });
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map