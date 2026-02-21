import { PrismaService } from '../prisma/prisma.service';
export declare class TreasuryService {
    private prisma;
    constructor(prisma: PrismaService);
    getReceivables(tenantId: string): Promise<{
        total: number;
        count: number;
    }>;
    getCashFlow(tenantId: string): Promise<{
        method: import("@prisma/client").$Enums.PaymentMethod;
        amount: number;
    }[]>;
    getMaturities(tenantId: string): Promise<({
        customer: {
            name: string;
            id: string;
            phone: string | null;
            rut: string;
            giro: string | null;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string | null;
            comuna: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tenantId: string;
        customerId: string;
        saleId: string | null;
        totalAmount: number;
        balance: number;
        dueDate: Date | null;
    })[]>;
}
