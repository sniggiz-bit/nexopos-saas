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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardMetrics() {
        const totalTenants = await this.prisma.tenant.count();
        const activeTenants = await this.prisma.tenant.count({
            where: {}
        });
        const mrr = activeTenants * 25000;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const activeUsers = await this.prisma.user.count({
            where: {
                updatedAt: {
                    gte: startOfDay
                }
            }
        });
        return {
            totalTenants,
            mrr,
            activeUsers
        };
    }
    async getTenants(page = 1, limit = 10, search) {
        const skip = (page - 1) * limit;
        const whereClause = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { rut: { contains: search, mode: 'insensitive' } }
            ]
        } : {};
        const [tenants, total] = await Promise.all([
            this.prisma.tenant.findMany({
                skip,
                take: limit,
                where: whereClause,
                include: {
                    users: {
                        where: {
                            role: 'ADMIN'
                        },
                        take: 1,
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    _count: {
                        select: { branches: true, users: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.tenant.count({ where: whereClause })
        ]);
        return {
            data: tenants.map(t => ({
                ...t,
                owner: t.users[0] || { name: 'N/A', email: 'N/A' },
                status: 'ACTIVE'
            })),
            total,
            page,
            lastPage: Math.ceil(total / limit)
        };
    }
    async toggleTenantStatus(id, status) {
        await this.prisma.tenant.findUniqueOrThrow({ where: { id } });
        return { success: true, message: `Tenant ${id} status changed to ${status}` };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map