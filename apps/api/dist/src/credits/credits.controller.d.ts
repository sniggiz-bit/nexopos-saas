import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
export declare class CreditsController {
    private readonly creditsService;
    constructor(creditsService: CreditsService);
    create(createCreditDto: CreateCreditDto): Promise<{
        id: string;
        totalAmount: number;
        balance: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerId: string;
        saleId: string | null;
    }>;
    findAll(tenantId: string, customerId?: string): Promise<({
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            rut: string;
            giro: string | null;
            address: string | null;
            comuna: string | null;
            email: string | null;
            phone: string | null;
        };
        sale: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            customerId: string | null;
            total: number;
            branchId: string;
            userId: string | null;
            cashShiftId: string | null;
            quoteId: string | null;
            dteFolio: number | null;
            dteStatus: string;
            dteType: number;
            dtePdfUrl: string | null;
            internalReceiptUrl: string | null;
        } | null;
    } & {
        id: string;
        totalAmount: number;
        balance: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerId: string;
        saleId: string | null;
    })[]>;
    findOne(id: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            rut: string;
            giro: string | null;
            address: string | null;
            comuna: string | null;
            email: string | null;
            phone: string | null;
        };
        sale: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            customerId: string | null;
            total: number;
            branchId: string;
            userId: string | null;
            cashShiftId: string | null;
            quoteId: string | null;
            dteFolio: number | null;
            dteStatus: string;
            dteType: number;
            dtePdfUrl: string | null;
            internalReceiptUrl: string | null;
        } | null;
        payments: {
            id: string;
            createdAt: Date;
            cashShiftId: string | null;
            creditId: string;
            amount: number;
            paymentMethod: string;
        }[];
    } & {
        id: string;
        totalAmount: number;
        balance: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerId: string;
        saleId: string | null;
    }>;
    addPayment(id: string, addPaymentDto: AddPaymentDto): Promise<any>;
}
