import { PaymentMethod } from '../sales/dto/create-sale.dto';
export interface LiorenDetalle {
    nombre: string;
    cantidad: number;
    precio: number;
}
export interface LiorenPayload {
    token: string;
    dte: {
        tipodoc: number;
        detalles: LiorenDetalle[];
        receptor?: {
            rut: string;
            rs: string;
            giro: string;
            comuna: string;
            ciudad: string;
            dir: string;
        };
        pago?: {
            formapago: number;
            mediopago?: string;
            fechapago?: string;
            montopago?: number;
        };
    };
}
export declare class LiorenHelper {
    static mapPaymentMethod(method: PaymentMethod): {
        formapago: number;
        mediopago: string;
    };
    static getTaxBreakdown(totalBruto: number): {
        neto: number;
        iva: number;
        bruto: number;
    };
}
