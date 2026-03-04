import { PrismaService } from '../prisma/prisma.service';
interface CreateSupplierDto {
    name: string;
    rut?: string;
    email?: string;
    phone?: string;
    address?: string;
}
interface UpdateSupplierDto {
    name?: string;
    rut?: string;
    email?: string;
    phone?: string;
    address?: string;
}
export declare class SuppliersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<{
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
    findOne(id: string, tenantId: string): Promise<{
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
    create(data: CreateSupplierDto, tenantId: string): Promise<{
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
    update(id: string, data: UpdateSupplierDto, tenantId: string): Promise<{
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
    remove(id: string, tenantId: string): Promise<{
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
export {};
