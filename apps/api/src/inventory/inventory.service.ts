import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { Prisma, MovementType } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Records a stock movement and updates the inventory level atomically.
   *
   * For OUT movements (qty < 0): uses Prisma's atomic `{ decrement }` which maps
   * to a single SQL `UPDATE ... SET quantity = quantity - N` statement. After the
   * update we check whether the resulting balance is negative and throw if so —
   * the enclosing transaction rolls back automatically, preventing overselling.
   *
   * For IN movements (qty > 0): uses atomic `upsert` with `{ increment }`.
   *
   * This approach eliminates the read-then-write race condition that existed
   * when two concurrent transactions both read the same stock level and then
   * each wrote a locally-calculated new balance.
   *
   * ADJUSTMENT movements are allowed to produce negative balances because they
   * represent manual stock corrections (e.g. confirming a theft write-off).
   */
  async logMovement(data: CreateMovementDto, tx?: Prisma.TransactionClient) {
    const prisma = tx || this.prisma;
    const qty = Number(data.quantity);

    let newBalance: number;

    if (qty < 0) {
      // OUT movement: atomic decrement, then validate
      const updated = await prisma.inventory.update({
        where: {
          productId_branchId: {
            productId: data.productId,
            branchId: data.branchId,
          },
        },
        data: { quantity: { decrement: Math.abs(qty) } },
      });

      newBalance = Number(updated.quantity);

      // Negative stock is only permitted for manual adjustments
      if (newBalance < 0 && data.type !== MovementType.ADJUSTMENT) {
        throw new BadRequestException(
          `Stock insuficiente para el producto ${data.productId}`,
        );
      }
    } else {
      // IN movement: atomic increment or create
      const updated = await prisma.inventory.upsert({
        where: {
          productId_branchId: {
            productId: data.productId,
            branchId: data.branchId,
          },
        },
        update: { quantity: { increment: qty } },
        create: {
          productId: data.productId,
          branchId: data.branchId,
          quantity: qty,
        },
      });
      newBalance = Number(updated.quantity);
    }

    await prisma.stockMovement.create({
      data: {
        productId: data.productId,
        branchId: data.branchId,
        quantity: qty,
        type: data.type,
        reference: data.reference ?? 'manual',
        balance: newBalance,
        userId: data.userId,
      },
    });

    if (!tx) {
      try {
        this.eventsGateway.emitInventoryUpdated([
          { productId: data.productId, newStock: newBalance },
        ]);
      } catch (error) {
        this.logger.error(`Failed to emit inventory_updated WebSocket event: ${error.message}`);
      }
    }

    return { newBalance };
  }

  async getKardex(productId: string, branchId?: string) {
    return this.prisma.stockMovement.findMany({
      where: branchId ? { productId, branchId } : { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    });
  }
}
