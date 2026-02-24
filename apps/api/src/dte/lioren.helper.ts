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
      formapago: number; // 1: Contado, 2: Crédito, 3: Sin costo
      mediopago?: string; // EF: Efectivo, DB: Débito, CR: Crédito, TR: Transferencia
      fechapago?: string;
      montopago?: number;
    };
  };
}

export class LiorenHelper {
  /**
   * Mapea un método de pago interno al código de Lioren
   * Nota: Lioren usa mediopago (EF, DB, CR, TR) en el objeto pago.
   */
  static mapPaymentMethod(method: PaymentMethod): {
    formapago: number;
    mediopago: string;
  } {
    switch (method) {
      case PaymentMethod.EFECTIVO:
        return { formapago: 1, mediopago: 'EF' };
      case PaymentMethod.DEBITO:
        return { formapago: 1, mediopago: 'DB' };
      case PaymentMethod.CREDITO:
        return { formapago: 1, mediopago: 'CR' };
      case PaymentMethod.TRANSFERENCIA:
        return { formapago: 1, mediopago: 'TR' };
      default:
        return { formapago: 1, mediopago: 'EF' };
    }
  }

  /**
   * Calcula el desglose de montos (Neto e IVA)
   * En Chile el IVA es el 19%
   */
  static getTaxBreakdown(totalBruto: number) {
    const factorIVA = 1.19;
    const neto = Math.round(totalBruto / factorIVA);
    const iva = totalBruto - neto;
    return { neto, iva, bruto: totalBruto };
  }
}
