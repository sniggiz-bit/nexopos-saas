import { SuppliersService } from './suppliers.service';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    private getTenantId;
    findAll(req: any): Promise<{
        name: string;
        id: string;
        phone: string | null;
        rut: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
    }[]>;
    findOne(id: string, req: any): Promise<{
        purchases: {
            id: string;
            status: import("@prisma/client").$Enums.PurchaseStatus;
            totalAmount: number;
            date: Date;
        }[];
    } & {
        name: string;
        id: string;
        phone: string | null;
        rut: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
    }>;
    create(body: {
        name: string;
        rut?: string;
        email?: string;
        phone?: string;
        address?: string;
    }, req: any): Promise<{
        name: string;
        id: string;
        phone: string | null;
        rut: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
    }>;
    update(id: string, body: {
        name?: string;
        rut?: string;
        email?: string;
        phone?: string;
        address?: string;
    }, req: any): Promise<{
        name: string;
        id: string;
        phone: string | null;
        rut: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
    }>;
    remove(id: string, req: any): Promise<{
        name: string;
        id: string;
        phone: string | null;
        rut: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
    }>;
}
