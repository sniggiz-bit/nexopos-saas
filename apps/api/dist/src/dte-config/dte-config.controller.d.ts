import { DteConfigService } from './dte-config.service';
export declare class CreateDteConfigDto {
    tenantId: string;
    liorenToken?: string;
    liorenLogo?: string;
    dteResolution?: string;
    resolutionDate?: Date;
}
export declare class UpdateDteConfigDto {
    liorenToken?: string;
    liorenLogo?: string;
    dteResolution?: string;
    resolutionDate?: Date;
}
export declare class DteConfigResponseDto {
    id: string;
    tenantId: string;
    liorenToken?: string;
    liorenLogo?: string;
    dteResolution?: string;
    resolutionDate?: Date;
}
export declare class DteConfigController {
    private readonly dteConfigService;
    constructor(dteConfigService: DteConfigService);
    findByTenant(tenantId?: string): Promise<DteConfigResponseDto | null>;
    upsert(createDteConfigDto: CreateDteConfigDto): Promise<DteConfigResponseDto>;
    update(id: string, updateDteConfigDto: UpdateDteConfigDto): Promise<DteConfigResponseDto>;
}
