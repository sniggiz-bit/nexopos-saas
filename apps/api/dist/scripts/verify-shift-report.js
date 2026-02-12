"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
class ShiftReportService {
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
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
}
async function main() {
    const prisma = new client_1.PrismaClient({});
    const shiftReportService = new ShiftReportService();
    let shift = await prisma.cashShift.findFirst({
        where: { status: 'OPEN' },
        include: {
            sales: {
                include: {
                    payments: true,
                },
            },
            branch: true,
        },
    });
    if (!shift) {
        console.log('No open shift found. Checking for closed ones for demo...');
        shift = await prisma.cashShift.findFirst({
            orderBy: { createdAt: 'desc' },
            include: {
                sales: {
                    include: {
                        payments: true,
                    },
                },
                branch: true,
            },
        });
        if (!shift) {
            console.log('No shift found at all.');
            return;
        }
        console.log(`Using latest shift (status: ${shift.status}) for verification: ${shift.id}`);
    }
    else {
        console.log(`Found open shift: ${shift.id}`);
    }
    const finalAmount = 15000;
    const userId = 'simulated-user-id';
    const totalsByMethod = {
        EFECTIVO: 0,
        DEBITO: 0,
        CREDITO: 0,
        TRANSFERENCIA: 0,
    };
    let totalSales = 0;
    let dteCount = 0;
    let ticketCount = 0;
    shift.sales.forEach(sale => {
        if (sale.dteFolio)
            dteCount++;
        else
            ticketCount++;
        sale.payments.forEach(payment => {
            const method = payment.paymentMethod;
            if (totalsByMethod.hasOwnProperty(method)) {
                totalsByMethod[method] += payment.amount;
            }
            totalSales += payment.amount;
        });
    });
    const totalNet = Math.round(totalSales / 1.19);
    const totalIva = totalSales - totalNet;
    const expectedAmount = Number(shift.initialAmount) + totalsByMethod.EFECTIVO;
    const difference = finalAmount - expectedAmount;
    const summary = {
        shiftId: shift.id,
        openedBy: shift.openedBy,
        closedBy: userId,
        startTime: shift.startTime,
        endTime: new Date(),
        initialAmount: Number(shift.initialAmount),
        finalAmount,
        expectedAmount,
        difference,
        totalSales,
        paymentMethods: totalsByMethod,
        taxSummary: {
            totalNet,
            totalIva,
            totalGross: totalSales,
        },
        documents: {
            dtes: dteCount,
            tickets: ticketCount,
        },
    };
    console.log('--- Summary Object ---');
    console.log(JSON.stringify(summary, null, 2));
    const report = shiftReportService.generateTextReport(summary, shift.branch.name);
    console.log('\n--- Text Report ---');
    console.log(report);
}
main()
    .catch((e) => console.error(e))
    .finally(async () => {
});
//# sourceMappingURL=verify-shift-report.js.map