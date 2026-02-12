import { ShiftsService } from './shifts.service';
export declare class ShiftsController {
    private readonly shiftsService;
    constructor(shiftsService: ShiftsService);
    openShift(body: {
        branchId: string;
        initialAmount: number;
        userId: string;
        tenantId: string;
    }): Promise<{
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
    closeShift(body: {
        shiftId: string;
        userId: string;
        finalAmount: number;
    }): Promise<{
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
