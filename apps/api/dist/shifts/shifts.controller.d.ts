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
        status: string;
        branchId: string;
        openedById: string;
        closedById: string | null;
        startTime: Date;
        endTime: Date | null;
        initialAmount: import("@prisma/client-runtime-utils").Decimal;
        finalAmount: import("@prisma/client-runtime-utils").Decimal | null;
        expectedAmount: import("@prisma/client-runtime-utils").Decimal | null;
        difference: import("@prisma/client-runtime-utils").Decimal | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    closeShift(body: {
        shiftId: string;
        userId: string;
        finalAmount: number;
    }): Promise<{
        shift: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            branchId: string;
            openedById: string;
            closedById: string | null;
            startTime: Date;
            endTime: Date | null;
            initialAmount: import("@prisma/client-runtime-utils").Decimal;
            finalAmount: import("@prisma/client-runtime-utils").Decimal | null;
            expectedAmount: import("@prisma/client-runtime-utils").Decimal | null;
            difference: import("@prisma/client-runtime-utils").Decimal | null;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
        };
        textReport: string;
    }>;
    getCurrentShift(branchId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        branchId: string;
        openedById: string;
        closedById: string | null;
        startTime: Date;
        endTime: Date | null;
        initialAmount: import("@prisma/client-runtime-utils").Decimal;
        finalAmount: import("@prisma/client-runtime-utils").Decimal | null;
        expectedAmount: import("@prisma/client-runtime-utils").Decimal | null;
        difference: import("@prisma/client-runtime-utils").Decimal | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    } | null>;
}
