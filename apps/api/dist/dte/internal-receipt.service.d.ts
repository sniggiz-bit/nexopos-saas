import { PrismaService } from '../prisma/prisma.service';
export declare class InternalReceiptService {
    private prisma;
    private readonly logger;
    private readonly uploadsDir;
    constructor(prisma: PrismaService);
    generateReceipt(saleId: string): Promise<string>;
    getReceiptPath(saleId: string): string | null;
    private formatCurrency;
    private formatDate;
    private getPaymentMethodLabel;
    private ensureUploadDirectory;
}
