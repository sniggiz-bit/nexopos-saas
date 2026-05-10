import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

interface PurchaseItemDto {
    productId: string;
    quantity: number;
    costPrice: number;
}

interface CreatePurchaseDto {
    supplierId?: string;
    branchId: string;
    notes?: string;
    items: PurchaseItemDto[];
}

@Injectable()
export class PurchasesService {
    constructor(
        private prisma: PrismaService,
        private eventsService: EventsService,
    ) { }

    // ─────────────────────────────────────────────────────────────────────
    // LIST all purchases for a tenant (with optional branchId filter)
    // ─────────────────────────────────────────────────────────────────────
    async findAll(tenantId: string, branchId?: string) {
        return this.prisma.purchase.findMany({
            where: {
                tenantId,
                ...(branchId ? { branchId } : {}),
            },
            include: {
                supplier: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true } },
                _count: { select: { items: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET one purchase with all its items
    // ─────────────────────────────────────────────────────────────────────
    async findOne(id: string, tenantId: string) {
        const purchase = await this.prisma.purchase.findUnique({
            where: { id },
            include: {
                supplier: { select: { id: true, name: true, rut: true } },
                branch: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, sku: true } },
                    },
                },
            },
        });

        if (!purchase) {
            throw new NotFoundException(`Purchase with id ${id} not found`);
        }

        if (purchase.tenantId !== tenantId) {
            throw new ForbiddenException('Access denied');
        }

        return purchase;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CREATE — Regla de Negocio Crítica:
    //   Usa $transaction para garantizar atomicidad:
    //   1) Guarda la cabecera + items de la compra
    //   2) Actualiza el stock (Inventory) de cada producto en la sucursal
    //   3) Registra un StockMovement por cada item (tipo: PURCHASE)
    //   4) Actualiza el costPrice del Producto
    // ─────────────────────────────────────────────────────────────────────
    async create(data: CreatePurchaseDto, tenantId: string) {
        const { supplierId, branchId, notes, items } = data;

        if (!items || items.length === 0) {
            throw new BadRequestException('A purchase must have at least one item');
        }

        return this.prisma.$transaction(async (tx) => {
            // ── Validar que la sucursal pertenece al tenant ───────────────
            const branch = await tx.branch.findUnique({ where: { id: branchId } });
            if (!branch || branch.tenantId !== tenantId) {
                throw new BadRequestException(
                    'Branch not found or does not belong to this tenant',
                );
            }

            // ── Validar que todos los productos existen en el tenant ──────
            const productIds = items.map((i) => i.productId);
            const products = await tx.product.findMany({
                where: { id: { in: productIds }, tenantId },
            });

            if (products.length !== productIds.length) {
                throw new BadRequestException(
                    'One or more products not found or do not belong to this tenant',
                );
            }

            // ── Calcular total de la compra ───────────────────────────────
            const totalAmount = items.reduce(
                (sum, item) => sum + item.quantity * item.costPrice,
                0,
            );

            // ── 1) Crear Purchase con sus PurchaseItems ───────────────────
            const purchase = await tx.purchase.create({
                data: {
                    tenantId,
                    branchId,
                    supplierId: supplierId || null,
                    notes,
                    totalAmount,
                    status: 'COMPLETED',
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            costPrice: item.costPrice,
                        })),
                    },
                },
                include: {
                    items: true,
                },
            });

            // ── 2 & 3) Por cada item: actualizar Inventory + StockMovement
            for (const item of items) {
                // Upsert inventory: incrementa si existe, crea si no existe
                await tx.inventory.upsert({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId,
                        },
                    },
                    update: {
                        quantity: { increment: item.quantity },
                    },
                    create: {
                        productId: item.productId,
                        branchId,
                        quantity: item.quantity,
                        minStock: 0,
                    },
                });

                // Registrar movimiento de stock histórico
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        branchId,
                        quantity: item.quantity,   // positivo → entrada
                        type: 'PURCHASE',
                        reference: `PURCHASE-${purchase.id}`,
                        balance: 0, // Calculado de forma simple (sin historial exacto)
                    },
                });

                // ── 4) Actualizar costPrice del producto con el último precio
                await tx.product.update({
                    where: { id: item.productId },
                    data: { costPrice: item.costPrice },
                });
            }

            this.eventsService.emit({
                type: 'purchase.created',
                tenantId,
                branchId,
                payload: { purchaseId: purchase.id },
            });

            return purchase;
        });
    }
}
