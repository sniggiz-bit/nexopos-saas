import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
export declare class CreditsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createCreditDto: CreateCreditDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tenantId: string;
        customerId: string;
        saleId: string | null;
        totalAmount: number;
        balance: number;
        dueDate: Date | null;
    }>;
    findAll(tenantId: string, customerId?: string): Promise<({
        sale: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            tenantId: string;
            total: number;
            branchId: string;
            userId: string | null;
            cashShiftId: string | null;
            customerId: string | null;
            quoteId: string | null;
            dteFolio: number | null;
            dteStatus: string;
            dteType: number;
            dtePdfUrl: string | null;
            internalReceiptUrl: string | null;
        } | null;
        customer: {
            name: string;
            id: string;
            phone: string | null;
            rut: string;
            giro: string | null;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string | null;
            comuna: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tenantId: string;
        customerId: string;
        saleId: string | null;
        totalAmount: number;
        balance: number;
        dueDate: Date | null;
    })[]>;
    findOne(id: string): Promise<{
        sale: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            tenantId: string;
            total: number;
            branchId: string;
            userId: string | null;
            cashShiftId: string | null;
            customerId: string | null;
            quoteId: string | null;
            dteFolio: number | null;
            dteStatus: string;
            dteType: number;
            dtePdfUrl: string | null;
            internalReceiptUrl: string | null;
        } | null;
        customer: {
            name: string;
            id: string;
            phone: string | null;
            rut: string;
            giro: string | null;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string | null;
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
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tenantId: string;
        customerId: string;
        saleId: string | null;
        totalAmount: number;
        balance: number;
        dueDate: Date | null;
    }>;
    addPayment(id: string, addPaymentDto: AddPaymentDto): Promise<any>;
}
