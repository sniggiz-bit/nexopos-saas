import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardMetrics(): Promise<{
        totalTenants: number;
        mrr: number;
        activeUsers: number;
    }>;
    getTenants(page?: number, limit?: number, search?: string): Promise<{
        data: {
            owner: {
                email: string;
                name: string | null;
            };
            status: string;
            _count: {
                branches: number;
                users: number;
            };
            users: {
                email: string;
                name: string | null;
            }[];
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            rut: string | null;
            giro: string | null;
            address: string | null;
        }[];
        total: number;
        page: number;
        lastPage: number;
    }>;
    toggleTenantStatus(id: string, status: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
