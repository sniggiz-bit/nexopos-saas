import { PrismaService } from '../prisma/prisma.service';
import { RecordTransactionDto } from './dto/record-transaction.dto';
import { TransbankBranchSettings } from './transbank.types';
export declare class TransbankService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    recordTransaction(dto: RecordTransactionDto): Promise<any>;
    findByOrderId(orderId: string): Promise<any>;
    findByTenant(tenantId: string, limit?: number): Promise<any>;
    linkToSale(orderId: string, saleId: string): Promise<any>;
    getConfig(branchId: string): Promise<{
        branchId: string | undefined;
        branchName: string | undefined;
        settings: TransbankBranchSettings;
    }>;
    saveConfig(branchId: string, settings: TransbankBranchSettings): Promise<{
        ok: boolean;
    }>;
}
