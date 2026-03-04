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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_fns_1 = require("date-fns");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats(tenantId, branchId = 'branch-1') {
        const today = (0, date_fns_1.startOfDay)(new Date());
        const firstDayOfMonth = (0, date_fns_1.startOfMonth)(new Date());
        const totalProducts = await this.prisma.product.count({
            where: {
                tenantId,
                isActive: true,
            },
        });
        const salesTodayResult = await this.prisma.sale.aggregate({
            where: {
                tenantId,
                branchId,
                status: 'COMPLETED',
                createdAt: {
                    gte: today,
                },
            },
            _sum: {
                total: true,
            },
        });
        const salesToday = Number(salesTodayResult._sum.total || 0);
        const monthRevenueResult = await this.prisma.sale.aggregate({
            where: {
                tenantId,
                branchId,
                status: 'COMPLETED',
                createdAt: {
                    gte: firstDayOfMonth,
                },
            },
            _sum: {
                total: true,
            },
        });
        const monthRevenue = Number(monthRevenueResult._sum.total || 0);
        const products = await this.prisma.product.findMany({
            where: {
                tenantId,
                isActive: true,
            },
            include: {
                inventory: {
                    where: { branchId },
                },
            },
        });
        const lowStockCount = products.filter((product) => {
            const stock = product.inventory.reduce((total, inv) => total + Number(inv.quantity), 0);
            return stock <= product.minStock;
        }).length;
        const totalSuppliers = await this.prisma.supplier.count({
            where: { tenantId },
        });
        const totalBranches = await this.prisma.branch.count({
            where: { tenantId, isActive: true },
        });
        const totalCustomers = await this.prisma.customer.count({
            where: { tenantId },
        });
        const totalQuotes = await this.prisma.quote.count({
            where: { tenantId },
        });
        return {
            totalProducts,
            totalSuppliers,
            totalBranches,
            totalCustomers,
            totalQuotes,
            salesToday,
            monthRevenue,
            lowStockCount,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map