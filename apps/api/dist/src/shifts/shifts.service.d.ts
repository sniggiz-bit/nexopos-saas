import { PrismaService } from '../prisma/prisma.service';
import { ShiftReportService } from './shift-report.service';
export declare class ShiftsService {
    private prisma;
    private shiftReportService;
    constructor(prisma: PrismaService, shiftReportService: ShiftReportService);
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
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    closeShift(shiftId: string, userId: string, finalAmount: number): Promise<{
        shift: {
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
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
        };
        textReport: string;
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
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    } | null>;
}
