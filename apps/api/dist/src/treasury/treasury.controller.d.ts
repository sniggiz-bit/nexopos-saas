import { TreasuryService } from './treasury.service';
export declare class TreasuryController {
    private readonly treasuryService;
    constructor(treasuryService: TreasuryService);
    getReceivables(tenantId: string): Promise<{
        total: number;
        count: number;
    }>;
    getCashFlow(tenantId: string): Promise<any>;
    getMaturities(tenantId: string): Promise<({
        customer: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            rut: string;
            giro: string | null;
            address: string | null;
            email: string | null;
            comuna: string | null;
            phone: string | null;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        customerId: string;
        saleId: string | null;
        balance: number;
        totalAmount: number;
        dueDate: Date | null;
    })[]>;
}
