import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    create(createSaleDto: CreateSaleDto): Promise<({
        branch: {
            id: string;
            tenantId: string;
            name: string;
        };
        user: {
            id: string;
            tenantId: string;
            branchId: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string | null;
            email: string;
        } | null;
        items: ({
            product: {
                id: string;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                price: number;
                sku: string | null;
                barcode: string | null;
                costPrice: number;
                minStock: number;
                unitType: import("@prisma/client").$Enums.UnitType;
                image: string | null;
                isActive: boolean;
                categoryId: string | null;
                brandId: string | null;
            };
        } & {
            id: string;
            saleId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            price: number;
        })[];
    } & {
        id: string;
        total: number;
        paymentMethod: string;
        tenantId: string;
        branchId: string;
        userId: string | null;
        dteType: number;
        dteFolio: number | null;
        dteStatus: string;
        dtePdfUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
}
