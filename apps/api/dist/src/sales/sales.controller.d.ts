import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    create(createSaleDto: CreateSaleDto): Promise<{
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
