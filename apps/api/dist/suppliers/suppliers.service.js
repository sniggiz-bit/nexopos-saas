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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const shared_1 = require("@nexopos/shared");
let SuppliersService = class SuppliersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        return this.prisma.supplier.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id, tenantId) {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id },
            include: {
                purchases: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        date: true,
                        totalAmount: true,
                        status: true,
                    },
                },
            },
        });
        if (!supplier) {
            throw new common_1.NotFoundException(`Supplier with id ${id} not found`);
        }
        if (supplier.tenantId !== tenantId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return supplier;
    }
    async create(data, tenantId) {
        return this.prisma.supplier.create({
            data: {
                ...data,
                rut: data.rut ? (0, shared_1.formatRut)(data.rut) : undefined,
                tenantId,
            },
        });
    }
    async update(id, data, tenantId) {
        await this.findOne(id, tenantId);
        const updateData = { ...data };
        if (updateData.rut)
            updateData.rut = (0, shared_1.formatRut)(updateData.rut);
        return this.prisma.supplier.update({
            where: { id },
            data: updateData,
        });
    }
    async remove(id, tenantId) {
        await this.findOne(id, tenantId);
        return this.prisma.supplier.delete({
            where: { id },
        });
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map