import { Injectable } from '@nestjs/common';

export interface ShiftSummary {
  shiftId: string;
  openedBy: string;
  closedBy: string;
  startTime: Date;
  endTime: Date;
  initialAmount: number;
  finalAmount: number;
  expectedAmount: number;
  difference: number;
  totalSales: number;
  paymentMethods: {
    EFECTIVO: number;
    DEBITO: number;
    CREDITO: number;
    TRANSFERENCIA: number;
  };
  taxSummary: {
    totalNet: number;
    totalIva: number;
    totalGross: number;
  };
  documents: {
    dtes: number; // Boletas electrónicas
    tickets: number; // Tickets internos
  };
}

@Injectable()
export class ShiftReportService {
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  generateTextReport(summary: ShiftSummary, branchName: string): string {
    const line = '-'.repeat(32);
    const doubleLine = '='.repeat(32);

    let report = '';
    report += `${doubleLine}\n`;
    report += `      RESUMEN DE CIERRE (Z)\n`;
    report += `${doubleLine}\n`;
    report += `SUCURSAL: ${branchName}\n`;
    report += `TURNO ID: ...${summary.shiftId.slice(-8)}\n`;
    report += `APERTURA: ${this.formatDate(summary.startTime)}\n`;
    report += `CIERRE  : ${this.formatDate(summary.endTime)}\n`;
    report += `ABIERTO POR: ${summary.openedBy}\n`;
    report += `CERRADO POR: ${summary.closedBy}\n`;
    report += `${line}\n\n`;

    report += `VENTAS POR MEDIO DE PAGO\n`;
    report += `${line}\n`;
    report += `EFECTIVO      : ${this.formatCurrency(summary.paymentMethods.EFECTIVO)}\n`;
    report += `DEBITO        : ${this.formatCurrency(summary.paymentMethods.DEBITO)}\n`;
    report += `CREDITO       : ${this.formatCurrency(summary.paymentMethods.CREDITO)}\n`;
    report += `TRANSFERENCIA : ${this.formatCurrency(summary.paymentMethods.TRANSFERENCIA)}\n`;
    report += `${line}\n`;
    report += `TOTAL VENTAS  : ${this.formatCurrency(summary.totalSales)}\n\n`;

    report += `RESUMEN TRIBUTARIO\n`;
    report += `${line}\n`;
    report += `NETO          : ${this.formatCurrency(summary.taxSummary.totalNet)}\n`;
    report += `IVA (19%)     : ${this.formatCurrency(summary.taxSummary.totalIva)}\n`;
    report += `TOTAL         : ${this.formatCurrency(summary.taxSummary.totalGross)}\n\n`;

    report += `DOCUMENTOS EMITIDOS\n`;
    report += `${line}\n`;
    report += `BOLETAS (DTE) : ${summary.documents.dtes}\n`;
    report += `TICKETS INT.  : ${summary.documents.tickets}\n\n`;

    report += `CUADRATURA DE CAJA\n`;
    report += `${line}\n`;
    report += `MONTO INICIAL : ${this.formatCurrency(summary.initialAmount)}\n`;
    report += `VENTAS EFECT. : ${this.formatCurrency(summary.paymentMethods.EFECTIVO)}\n`;
    report += `ESPERADO      : ${this.formatCurrency(summary.expectedAmount)}\n`;
    report += `REAL (DECLAR.): ${this.formatCurrency(summary.finalAmount)}\n`;
    report += `${doubleLine}\n`;

    const diffLabel = summary.difference >= 0 ? 'SOBRANTE' : 'FALTANTE';
    report += `DIFERENCIA    : ${this.formatCurrency(summary.difference)} (${diffLabel})\n`;
    report += `${doubleLine}\n\n\n`;

    return report;
  }
}
