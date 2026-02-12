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
    }>;
    findAll(tenantId: string, customerId?: string): Promise<({
        customer: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            rut: string;
            giro: string | null;
            address: string | null;
            email: string | null;
            comuna: string | null;
            phone: string | null;
        };
        sale: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            branchId: string;
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
    })[]>;
    findOne(id: string): Promise<{
        customer: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            rut: string;
            giro: string | null;
            address: string | null;
            email: string | null;
            comuna: string | null;
            phone: string | null;
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
            createdAt: Date;
            updatedAt: Date;
            branchId: string;
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
    }>;
    addPayment(id: string, addPaymentDto: AddPaymentDto): Promise<any>;
}
