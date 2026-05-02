import { TransbankService } from './transbank.service';
import { RecordTransactionDto } from './dto/record-transaction.dto';
import type { TransbankBranchSettings } from './transbank.types';
export declare class TransbankController {
    private readonly transbankService;
    constructor(transbankService: TransbankService);
    recordTransaction(dto: RecordTransactionDto): Promise<any>;
    findByOrderId(orderId: string): Promise<any>;
    findByTenant(tenantId: string): Promise<any>;
    linkToSale(body: {
        orderId: string;
        saleId: string;
    }): Promise<any>;
    getConfig(branchId: string): Promise<{
        branchId: string | undefined;
        branchName: string | undefined;
        settings: TransbankBranchSettings;
    }>;
    saveConfig(branchId: string, body: TransbankBranchSettings): Promise<{
        ok: boolean;
    }>;
}
