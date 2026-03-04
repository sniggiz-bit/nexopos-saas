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
exports.TransfersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TransfersService = class TransfersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const { originBranchId, destBranchId, items, note, userId } = data;
        if (originBranchId === destBranchId) {
            throw new common_1.BadRequestException('Origin and destination branches must be different');
        }
        return this.prisma.$transaction(async (tx) => {
            const originBranch = await tx.branch.findUnique({
                where: { id: originBranchId },
            });
            const destBranch = await tx.branch.findUnique({
                where: { id: destBranchId },
            });
            if (!originBranch || !destBranch) {
                throw new common_1.BadRequestException('One or both branches do not exist');
            }
            for (const item of items) {
                const inventory = await tx.inventory.findUnique({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: originBranchId,
                        },
                    },
                });
                if (!inventory || inventory.quantity.toNumber() < item.quantity) {
                    throw new common_1.BadRequestException(`Insufficient stock for product ${item.productId} in origin branch`);
                }
            }
            const transfer = await tx.transfer.create({
                data: {
                    originBranchId,
                    destBranchId,
                    requestedById: userId,
                    status: 'COMPLETED',
                    note,
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                        })),
                    },
                },
            });
            for (const item of items) {
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        branchId: originBranchId,
                        quantity: -item.quantity,
                        type: 'TRANSFER_OUT',
                        reference: `TRANSFER-${transfer.id}`,
                        balance: 0,
                        userId,
                    },
                });
                await tx.inventory.update({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: originBranchId,
                        },
                    },
                    data: {
                        quantity: { decrement: item.quantity },
                    },
                });
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        branchId: destBranchId,
                        quantity: item.quantity,
                        type: 'TRANSFER_IN',
                        reference: `TRANSFER-${transfer.id}`,
                        balance: 0,
                        userId,
                    },
                });
                await tx.inventory.upsert({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: destBranchId,
                        },
                    },
                    update: {
                        quantity: { increment: item.quantity },
                    },
                    create: {
                        productId: item.productId,
                        branchId: destBranchId,
                        quantity: item.quantity,
                        minStock: 0,
                    },
                });
            }
            return transfer;
        });
    }
    async findAll(tenantId) {
        return this.prisma.transfer.findMany({
            where: {
                originBranch: {
                    tenantId,
                },
            },
            include: {
                originBranch: true,
                destinationBranch: true,
                requestedBy: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
};
exports.TransfersService = TransfersService;
exports.TransfersService = TransfersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransfersService);
//# sourceMappingURL=transfers.service.js.map