import { TenantsService } from './tenants.service';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    findAll(search?: string): Promise<any[]>;
    findOne(id: string, req: any): Promise<any>;
    updateSettings(id: string, dto: UpdateTenantSettingsDto): Promise<any>;
    suspend(id: string): Promise<{
        id: string;
        slug: string;
        storeSlug: string | null;
        name: string;
        phone: string | null;
        rut: string | null;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        planId: string | null;
        status: string;
        nextPayment: Date | null;
        storeSettings: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    activate(id: string): Promise<{
        id: string;
        slug: string;
        storeSlug: string | null;
        name: string;
        phone: string | null;
        rut: string | null;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        planId: string | null;
        status: string;
        nextPayment: Date | null;
        storeSettings: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
