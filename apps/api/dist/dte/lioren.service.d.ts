import { PrismaService } from '../prisma/prisma.service';
export declare class LiorenService {
    private prisma;
    private readonly logger;
    private readonly apiUrl;
    private readonly apiKey;
    private readonly defaultToken;
    constructor(prisma: PrismaService);
    emitirBoleta(saleId: string): Promise<{
        success: boolean;
        message: string;
        folio?: undefined;
        url_pdf?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        folio: any;
        url_pdf: any;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        folio?: undefined;
        url_pdf?: undefined;
    }>;
}
