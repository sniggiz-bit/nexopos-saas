import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<{
        totalTenants: number;
        mrr: number;
        activeUsers: number;
    }>;
    getTenants(page?: number, limit?: number, search?: string): Promise<{
        data: {
            owner: {
                name: string | null;
                id: string;
                email: string;
            };
            status: string;
            users: {
                name: string | null;
                id: string;
                email: string;
            }[];
            _count: {
                users: number;
                branches: number;
            };
            name: string;
            id: string;
            slug: string;
            phone: string | null;
            rut: string | null;
            giro: string | null;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            planId: string | null;
            nextPayment: Date | null;
            storeSlug: string | null;
            storeSettings: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
        total: number;
        page: number;
        lastPage: number;
    }>;
    toggleStatus(id: string, status: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
