import { TransbankService } from './transbank.service';
import { RecordTransactionDto } from './dto/record-transaction.dto';
import type { TransbankBranchSettings } from './transbank.types';
export declare class TransbankController {
    private readonly transbankService;
    constructor(transbankService: TransbankService);
    recordTransaction(dto: RecordTransactionDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TransbankStatus;
        tenantId: string;
        branchId: string;
        saleId: string | null;
        orderId: string;
        amount: number;
        provider: string;
        responseCode: number | null;
        authorizationCode: string | null;
        responseMessage: string | null;
        cardType: string | null;
        lastFourDigits: string | null;
        transactionDate: Date | null;
        installments: number | null;
        rawResponse: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    findByOrderId(orderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TransbankStatus;
        tenantId: string;
        branchId: string;
        saleId: string | null;
        orderId: string;
        amount: number;
        provider: string;
        responseCode: number | null;
        authorizationCode: string | null;
        responseMessage: string | null;
        cardType: string | null;
        lastFourDigits: string | null;
        transactionDate: Date | null;
        installments: number | null;
        rawResponse: import("@prisma/client/runtime/client").JsonValue | null;
    } | null>;
    findByTenant(tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TransbankStatus;
        tenantId: string;
        branchId: string;
        saleId: string | null;
        orderId: string;
        amount: number;
        provider: string;
        responseCode: number | null;
        authorizationCode: string | null;
        responseMessage: string | null;
        cardType: string | null;
        lastFourDigits: string | null;
        transactionDate: Date | null;
        installments: number | null;
        rawResponse: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
    linkToSale(body: {
        orderId: string;
        saleId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TransbankStatus;
        tenantId: string;
        branchId: string;
        saleId: string | null;
        orderId: string;
        amount: number;
        provider: string;
        responseCode: number | null;
        authorizationCode: string | null;
        responseMessage: string | null;
        cardType: string | null;
        lastFourDigits: string | null;
        transactionDate: Date | null;
        installments: number | null;
        rawResponse: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    getConfig(branchId: string): Promise<{
        branchId: string | undefined;
        branchName: string | undefined;
        settings: TransbankBranchSettings;
    }>;
    saveConfig(branchId: string, body: TransbankBranchSettings): Promise<{
        ok: boolean;
    }>;
}
