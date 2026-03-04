"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftReportService = void 0;
const common_1 = require("@nestjs/common");
let ShiftReportService = class ShiftReportService {
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
        }).format(amount);
    }
    formatDate(date) {
        return new Intl.DateTimeFormat('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    }
    generateTextReport(summary, branchName) {
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
};
exports.ShiftReportService = ShiftReportService;
exports.ShiftReportService = ShiftReportService = __decorate([
    (0, common_1.Injectable)()
], ShiftReportService);
//# sourceMappingURL=shift-report.service.js.map