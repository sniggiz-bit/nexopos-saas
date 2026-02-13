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
                id: string;
                email: string;
                name: string | null;
            };
            status: string;
            _count: {
                branches: number;
                users: number;
            };
            users: {
                id: string;
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
            planId: string | null;
            nextPayment: Date | null;
            maxUsers: number | null;
            maxProducts: number | null;
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
