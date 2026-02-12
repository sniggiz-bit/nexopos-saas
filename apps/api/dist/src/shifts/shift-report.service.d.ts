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
        dtes: number;
        tickets: number;
    };
}
export declare class ShiftReportService {
    formatCurrency(amount: number): string;
    formatDate(date: Date): string;
    generateTextReport(summary: ShiftSummary, branchName: string): string;
}
