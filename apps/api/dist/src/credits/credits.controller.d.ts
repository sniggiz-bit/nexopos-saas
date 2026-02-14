import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
export declare class CreditsController {
    private readonly creditsService;
    constructor(creditsService: CreditsService);
    create(createCreditDto: CreateCreditDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        customerId: string;
        saleId: string | null;
        balance: number;
        totalAmount: number;
        dueDate: Date | null;
    }>;
    findAll(tenantId: string, customerId?: string): Promise<({
        customer: {
            id: string;
            email: string | null;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            rut: string;
            giro: string | null;
            address: string | null;
            comuna: string | null;
        };
        sale: {
            id: string;
            tenantId: string;
            branchId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            total: number;
            dteFolio: number | null;
            dteStatus: string;
            dteType: number;
            dtePdfUrl: string | null;
            internalReceiptUrl: string | null;
            userId: string | null;
            cashShiftId: string | null;
            customerId: string | null;
            quoteId: string | null;
        } | null;
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        customerId: string;
        saleId: string | null;
        balance: number;
        totalAmount: number;
        dueDate: Date | null;
    })[]>;
    findOne(id: string): Promise<{
        customer: {
            id: string;
            email: string | null;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            rut: string;
            giro: string | null;
            address: string | null;
            comuna: string | null;
        };
        payments: {
            id: string;
            createdAt: Date;
            cashShiftId: string | null;
            amount: number;
            paymentMethod: string;
            creditId: string;
        }[];
        sale: {
            id: string;
            tenantId: string;
            branchId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            total: number;
            dteFolio: number | null;
            dteStatus: string;
            dteType: number;
            dtePdfUrl: string | null;
            internalReceiptUrl: string | null;
            userId: string | null;
            cashShiftId: string | null;
            customerId: string | null;
            quoteId: string | null;
        } | null;
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        customerId: string;
        saleId: string | null;
        balance: number;
        totalAmount: number;
        dueDate: Date | null;
    }>;
    addPayment(id: string, addPaymentDto: AddPaymentDto): Promise<any>;
}
