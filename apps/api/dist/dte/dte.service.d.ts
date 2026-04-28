import { LiorenService } from './lioren.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class DteService {
    private liorenService;
    private prisma;
    constructor(liorenService: LiorenService, prisma: PrismaService);
    emitirDte(saleId: string): Promise<{
        success: boolean;
        folio: any;
        url_pdf: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        folio?: undefined;
        url_pdf?: undefined;
    }>;
}
