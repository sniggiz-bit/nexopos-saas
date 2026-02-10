import { PrismaService } from '../prisma/prisma.service';
export declare class DteService {
    private prisma;
    constructor(prisma: PrismaService);
    emitirDte(saleId: string): Promise<{
        success: boolean;
        folio: number;
        status: string;
        saleId: string;
        message: string;
    }>;
    private generateRandomFolio;
    private delay;
}
