import { PrismaService } from '../prisma/prisma.service';
export declare class ShiftsService {
    private prisma;
    constructor(prisma: PrismaService);
    openShift(tenantId: string, branchId: string, userId: string, initialAmount: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        openedBy: string;
        closedBy: string | null;
        startTime: Date;
        endTime: Date | null;
        initialAmount: import("@prisma/client-runtime-utils").Decimal;
        finalAmount: import("@prisma/client-runtime-utils").Decimal | null;
        expectedAmount: import("@prisma/client-runtime-utils").Decimal | null;
        difference: import("@prisma/client-runtime-utils").Decimal | null;
        status: string;
    }>;
    closeShift(shiftId: string, userId: string, finalAmount: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        openedBy: string;
        closedBy: string | null;
        startTime: Date;
        endTime: Date | null;
        initialAmount: import("@prisma/client-runtime-utils").Decimal;
        finalAmount: import("@prisma/client-runtime-utils").Decimal | null;
        expectedAmount: import("@prisma/client-runtime-utils").Decimal | null;
        difference: import("@prisma/client-runtime-utils").Decimal | null;
        status: string;
    }>;
    getCurrentShift(branchId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        openedBy: string;
        closedBy: string | null;
        startTime: Date;
        endTime: Date | null;
        initialAmount: import("@prisma/client-runtime-utils").Decimal;
        finalAmount: import("@prisma/client-runtime-utils").Decimal | null;
        expectedAmount: import("@prisma/client-runtime-utils").Decimal | null;
        difference: import("@prisma/client-runtime-utils").Decimal | null;
        status: string;
    } | null>;
}
