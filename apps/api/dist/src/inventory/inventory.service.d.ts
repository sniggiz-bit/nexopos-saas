import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { Prisma } from '@prisma/client';
export declare class InventoryService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    logMovement(data: CreateMovementDto, tx?: Prisma.TransactionClient): Promise<{
        newBalance: number;
    }>;
    getKardex(productId: string, branchId: string): Promise<({
        user: {
            name: string | null;
        } | null;
    } & {
        id: string;
        branchId: string;
        createdAt: Date;
        productId: string;
        quantity: Prisma.Decimal;
        userId: string | null;
        type: import("@prisma/client").$Enums.MovementType;
        reference: string | null;
        balance: Prisma.Decimal;
    })[]>;
}
