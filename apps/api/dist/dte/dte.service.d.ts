import { LiorenService } from './lioren.service';
export declare class DteService {
    private liorenService;
    constructor(liorenService: LiorenService);
    emitirDte(saleId: string): Promise<{
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
