import { PrismaService } from '../prisma/prisma.service';
import { Tenant } from '@prisma/client';
export declare class TenantsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(search?: string): Promise<Tenant[]>;
    findOne(id: string): Promise<Tenant | null>;
    updateLimits(id: string, limits: {
        maxUsers?: number;
        maxProducts?: number;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        phone: string | null;
        rut: string | null;
        giro: string | null;
        address: string | null;
        planId: string | null;
        status: string;
        nextPayment: Date | null;
        maxUsers: number | null;
        maxProducts: number | null;
    }>;
    suspend(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        phone: string | null;
        rut: string | null;
        giro: string | null;
        address: string | null;
        planId: string | null;
        status: string;
        nextPayment: Date | null;
        maxUsers: number | null;
        maxProducts: number | null;
    }>;
    activate(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        phone: string | null;
        rut: string | null;
        giro: string | null;
        address: string | null;
        planId: string | null;
        status: string;
        nextPayment: Date | null;
        maxUsers: number | null;
        maxProducts: number | null;
    }>;
}
