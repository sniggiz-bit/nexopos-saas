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
    consultaRut(rut: string): Promise<{
        success: boolean;
        data: {
            reasonSocial: any;
            giro: any;
            address: any;
            comuna: any;
            city: any;
        };
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
        message?: undefined;
    }>;
}
