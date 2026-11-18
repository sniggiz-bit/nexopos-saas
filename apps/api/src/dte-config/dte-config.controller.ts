import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ForbiddenException, Res } from '@nestjs/common';
import { IsString, IsOptional, MaxLength, IsDateString, IsNotEmpty } from 'class-validator';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { DteConfigService } from './dte-config.service';
import { LiorenAccountService } from '../dte/lioren-account.service';
import { LiorenService } from '../dte/lioren.service';
export class UpsertDteConfigDto {
  @IsOptional() @IsString() @MaxLength(8192) liorenToken?: string;
  @IsOptional() @IsString() @MaxLength(2048) liorenLogo?: string;
  @IsOptional() @IsString() @MaxLength(40) dteResolution?: string;
  @IsOptional() @IsDateString() resolutionDate?: string;
}
class SyncIssuerDto { @IsString() @IsNotEmpty() @MaxLength(20) expectedRut: string; }
function requireAdmin(user: any) { if (!['TENANT_ADMIN', 'SUPER_ADMIN'].includes(user.role)) throw new ForbiddenException('Solo el administrador puede gestionar la configuración tributaria.'); }
@Controller('dte-config')
@UseGuards(JwtAuthGuard)
export class DteConfigController {
  constructor(private readonly config: DteConfigService, private readonly account: LiorenAccountService, private readonly lioren: LiorenService) {}
  @Get() find(@CurrentUser() user: any) { requireAdmin(user); return this.config.findByTenant(user.tenantId); }
  @Get('status') status(@CurrentUser() user: any, @Query('refresh') refresh?: string) { requireAdmin(user); return this.account.status(user.tenantId, refresh === '1'); }
  @Get('stats') stats(@CurrentUser() user: any, @Query('refresh') refresh?: string) { requireAdmin(user); return this.config.getStats(user.tenantId, refresh === '1'); }
  @Get('folios') async folios(@CurrentUser() user: any) { requireAdmin(user); return (await this.account.status(user.tenantId)).types; }
  @Post('sync-issuer') sync(@CurrentUser() user: any, @Body() dto: SyncIssuerDto) { requireAdmin(user); return this.account.syncIssuer(user.tenantId, dto.expectedRut, user.id); }
  @Post() upsert(@CurrentUser() user: any, @Body() dto: UpsertDteConfigDto) { requireAdmin(user); return this.config.upsert({ ...dto, tenantId: user.tenantId, resolutionDate: dto.resolutionDate ? new Date(dto.resolutionDate) : undefined }); }
  @Patch(':id') update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpsertDteConfigDto) { requireAdmin(user); return this.config.update(id, user.tenantId, { ...dto, resolutionDate: dto.resolutionDate ? new Date(dto.resolutionDate) : undefined }); }
  @Get('documents/:type/:folio/pdf') async pdf(@CurrentUser() user: any, @Param('type') type: string, @Param('folio') folio: string, @Res() res: Response) {
    requireAdmin(user); const buffer = await this.lioren.documentPdf(user.tenantId, Number(type), Number(folio));
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="dte-' + Number(type) + '-' + Number(folio) + '.pdf"', 'Cache-Control': 'no-store' }); res.send(buffer);
  }
}
