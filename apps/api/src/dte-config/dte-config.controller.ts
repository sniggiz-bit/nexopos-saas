import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { DteConfigService } from './dte-config.service';

export class CreateDteConfigDto {
    tenantId: string;
    liorenToken?: string;
    liorenLogo?: string;
    dteResolution?: string;
    resolutionDate?: Date;
}

export class UpdateDteConfigDto {
    liorenToken?: string;
    liorenLogo?: string;
    dteResolution?: string;
    resolutionDate?: Date;
}

export class DteConfigResponseDto {
    id: string;
    tenantId: string;
    liorenToken?: string;
    liorenLogo?: string;
    dteResolution?: string;
    resolutionDate?: Date;
}

@Controller('dte-config')
export class DteConfigController {
    constructor(private readonly dteConfigService: DteConfigService) { }

    @Get()
    async findByTenant(
        @Query('tenantId') tenantId: string = 'tenant-1',
    ): Promise<DteConfigResponseDto | null> {
        return this.dteConfigService.findByTenant(tenantId);
    }

    @Post()
    async upsert(@Body() createDteConfigDto: CreateDteConfigDto): Promise<DteConfigResponseDto> {
        return this.dteConfigService.upsert(createDteConfigDto);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateDteConfigDto: UpdateDteConfigDto,
    ): Promise<DteConfigResponseDto> {
        return this.dteConfigService.update(id, updateDteConfigDto);
    }
}
