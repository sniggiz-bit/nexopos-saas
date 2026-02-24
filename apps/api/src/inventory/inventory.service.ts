import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records a stock movement and updates the inventory level.
   * MUST be called within a transaction if part of a larger operation (like a sale).
   */
  async logMovement(data: CreateMovementDto, tx?: Prisma.TransactionClient) {
    const prisma = tx || this.prisma;

    // 1. Get current stock to calculate new balance
    const currentInventory = await prisma.inventory.findUnique({
      where: {
        productId_branchId: {
          productId: data.productId,
          branchId: data.branchId,
        },
      },
    });

    const currentQty = currentInventory ? Number(currentInventory.quantity) : 0;
    const newBalance = currentQty + Number(data.quantity); // Quantity is signed (+ for IN, - for OUT)

    // 2. Create Movement Record
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

    // 3. InventoryLevel update is handled by the caller (SalesService) OR we do it here?
    // Ideally, we do it here to ensure consistency between Movement and Level.
    // But SalesService already updates InventoryLevel.
    // Let's UPDATE it here to be safe and centralized, but we need to handle the case where
    // SalesService might have already decremented it if we are not careful.
    // For now, let's assume SalesService DELEGATES the update to this service,
    // OR we just log the movement here and trust the caller to update the level.
    // BETTER APPROACH: The caller (SalesService) should call this method, and THIS method updates both.

    await prisma.inventory.upsert({
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

  async getKardex(productId: string, branchId: string) {
    return this.prisma.stockMovement.findMany({
      where: { productId, branchId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    });
  }
}
