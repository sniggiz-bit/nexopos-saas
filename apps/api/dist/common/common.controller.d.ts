import { LiorenService } from '../dte/lioren.service';
export declare class CommonController {
    private readonly liorenService;
    constructor(liorenService: LiorenService);
    lookupRut(rut: string): Promise<{
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
