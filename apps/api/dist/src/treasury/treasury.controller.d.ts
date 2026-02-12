import { TreasuryService } from './treasury.service';
export declare class TreasuryController {
    private readonly treasuryService;
    constructor(treasuryService: TreasuryService);
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
            rut: string;
            giro: string | null;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string | null;
            comuna: string | null;
            phone: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerId: string;
        status: string;
        saleId: string | null;
        totalAmount: number;
        balance: number;
        dueDate: Date | null;
    })[]>;
}
