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
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BranchesService = class BranchesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const branch = await this.prisma.branch.create({
            data,
        });
        const products = await this.prisma.product.findMany({
            where: { tenantId: data.tenantId },
            select: { id: true },
        });
        if (products.length > 0) {
            await this.prisma.inventory.createMany({
                data: products.map((product) => ({
                    productId: product.id,
                    branchId: branch.id,
                    quantity: 0,
                    minStock: 0,
                })),
                skipDuplicates: true,
            });
        }
        return branch;
    }
    async findAll(tenantId) {
        return this.prisma.branch.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async findOne(id) {
        return this.prisma.branch.findUnique({
            where: { id },
        });
    }
    async findAllSystemWide() {
        return this.prisma.branch.findMany({
            include: {
                tenant: {
                    select: {
                        name: true,
                        id: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(id, isActive) {
        return this.prisma.branch.update({
            where: { id },
            data: { isActive },
        });
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchesService);
//# sourceMappingURL=branches.service.js.map