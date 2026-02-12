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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = InventoryService_1 = class InventoryService {
    prisma;
    logger = new common_1.Logger(InventoryService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logMovement(data, tx) {
        const prisma = tx || this.prisma;
        const currentInventory = await prisma.inventoryLevel.findUnique({
            where: {
                productId_branchId: {
                    productId: data.productId,
                    branchId: data.branchId,
                },
            },
        });
        const currentQty = currentInventory ? Number(currentInventory.quantity) : 0;
        const newBalance = currentQty + Number(data.quantity);
        await prisma.stockMovement.create({
            data: {
                productId: data.productId,
                branchId: data.branchId,
                quantity: data.quantity,
                type: data.type,
                reference: data.reference,
                balance: newBalance,
                userId: data.userId,
            },
        });
        await prisma.inventoryLevel.upsert({
            where: {
                productId_branchId: {
                    productId: data.productId,
                    branchId: data.branchId,
                },
            },
            create: {
                productId: data.productId,
                branchId: data.branchId,
                quantity: newBalance,
            },
            update: {
                quantity: newBalance,
            },
        });
        return { newBalance };
    }
    async getKardex(productId, branchId) {
        return this.prisma.stockMovement.findMany({
            where: { productId, branchId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true } }
            }
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map