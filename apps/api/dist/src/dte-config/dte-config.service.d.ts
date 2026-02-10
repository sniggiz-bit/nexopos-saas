import { PrismaService } from '../prisma/prisma.service';
interface CreateDteConfigDto {
    tenantId: string;
    liorenToken?: string;
    liorenLogo?: string;
    dteResolution?: string;
    resolutionDate?: Date;
}
interface UpdateDteConfigDto {
    liorenToken?: string;
    liorenLogo?: string;
    dteResolution?: string;
    resolutionDate?: Date;
}
interface DteConfigResponseDto {
    id: string;
    tenantId: string;
    liorenToken?: string;
    liorenLogo?: string;
    dteResolution?: string;
    resolutionDate?: Date;
}
export declare class DteConfigService {
    private prisma;
    constructor(prisma: PrismaService);
    findByTenant(tenantId: string): Promise<DteConfigResponseDto | null>;
    upsert(createDteConfigDto: CreateDteConfigDto): Promise<DteConfigResponseDto>;
    update(id: string, updateDteConfigDto: UpdateDteConfigDto): Promise<DteConfigResponseDto>;
}
export {};
