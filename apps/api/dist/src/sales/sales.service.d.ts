import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
export declare class SalesService {
    private prisma;
    constructor(prisma: PrismaService);
    createSale(createSaleDto: CreateSaleDto): Promise<{
        items: {
            id: string;
            quantity: number;
            price: number;
            productId: string;
            saleId: string;
        }[];
    } & {
        tenantId: string;
        branchId: string;
        userId: string | null;
        id: string;
        total: number;
        dte_folio: number | null;
        dte_type: number | null;
        dte_status: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
