import {
  Controller, Get, Post, Patch, Body, Param, UseGuards,
} from '@nestjs/common';

import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { DteConfigService, DteConfigResponseDto } from './dte-config.service';
import { LiorenService } from '../dte/lioren.service';

export class UpsertDteConfigDto {
  @IsOptional() @IsString() liorenToken?: string;
  @IsOptional() @IsString() liorenLogo?: string;
  @IsOptional() @IsString() dteResolution?: string;
  @IsOptional() @IsString() resolutionDate?: string;
}

export class UpdateDteConfigDto {
  @IsOptional() @IsString() liorenToken?: string;
  @IsOptional() @IsString() liorenLogo?: string;
  @IsOptional() @IsString() dteResolution?: string;
  @IsOptional() @IsString() resolutionDate?: string;
}

@Controller('dte-config')
@UseGuards(JwtAuthGuard)
export class DteConfigController {
  constructor(
    private readonly dteConfigService: DteConfigService,
    private readonly liorenService: LiorenService,
  ) {}

  @Get()
  findByTenant(@CurrentUser() user: any): Promise<DteConfigResponseDto | null> {
    return this.dteConfigService.findByTenant(user.tenantId);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any): Promise<object> {
    return this.dteConfigService.getStats(user.tenantId);
  }

  @Get('folios')
  getFolios(@CurrentUser() user: any) {
    return this.liorenService.consultarFolios(user.tenantId);
  }

  @Post()
  upsert(@CurrentUser() user: any, @Body() dto: UpsertDteConfigDto): Promise<DteConfigResponseDto> {
    // Build update object with only defined fields to avoid overwriting existing
    // DB values with null when the user doesn't change a particular field.
    const payload: Record<string, any> = { tenantId: user.tenantId };
    if (dto.liorenToken !== undefined) payload.liorenToken = dto.liorenToken;
    if (dto.liorenLogo !== undefined) payload.liorenLogo = dto.liorenLogo;
    if (dto.dteResolution !== undefined) payload.dteResolution = dto.dteResolution;
    if (dto.resolutionDate !== undefined) payload.resolutionDate = dto.resolutionDate ? new Date(dto.resolutionDate) : null;

    return this.dteConfigService.upsert(payload as any);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDteConfigDto): Promise<DteConfigResponseDto> {
    return this.dteConfigService.update(id, {
      liorenToken: dto.liorenToken,
      liorenLogo: dto.liorenLogo,
      dteResolution: dto.dteResolution,
      resolutionDate: dto.resolutionDate ? new Date(dto.resolutionDate) : undefined,
    });
  }
}
