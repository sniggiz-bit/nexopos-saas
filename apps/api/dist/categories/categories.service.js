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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        const categories = await this.prisma.category.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        return categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            productCount: cat._count.products,
        }));
    }
    async create(createCategoryDto) {
        const existing = await this.prisma.category.findFirst({
            where: {
                name: createCategoryDto.name,
                tenantId: createCategoryDto.tenantId,
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Category with name "${createCategoryDto.name}" already exists for this tenant`);
        }
        const category = await this.prisma.category.create({
            data: createCategoryDto,
        });
        return {
            id: category.id,
            name: category.name,
            productCount: 0,
        };
    }
    async update(id, tenantId, updateCategoryDto) {
        const category = await this.prisma.category.update({
            where: { id, tenantId },
            data: updateCategoryDto,
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });
        return {
            id: category.id,
            name: category.name,
            productCount: category._count.products,
        };
    }
    async remove(id, tenantId) {
        const category = await this.prisma.category.findUnique({
            where: { id, tenantId },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${id} not found`);
        }
        if (category._count.products > 0) {
            throw new common_1.ConflictException(`Cannot delete category with ${category._count.products} associated products`);
        }
        await this.prisma.category.delete({
            where: { id, tenantId },
        });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map