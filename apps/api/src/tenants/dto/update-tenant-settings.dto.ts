import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateTenantSettingsDto {
  // --- Módulos DTE ---
  @IsOptional()
  @IsBoolean()
  enableBoletaDte?: boolean;

  @IsOptional()
  @IsBoolean()
  enableFacturaDte?: boolean;

  @IsOptional()
  @IsBoolean()
  enableGuiaDespachoDte?: boolean;

  @IsOptional()
  @IsBoolean()
  enableNotaCreditoDte?: boolean;

  // --- Límites de Recursos ---
  @IsOptional()
  @IsInt()
  @Min(1)
  maxBranches?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxRegisters?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  // --- Permisos Especiales ---
  @IsOptional()
  @IsBoolean()
  canHardDelete?: boolean;

  // --- Feature Flags ---
  @IsOptional()
  @IsBoolean()
  enableEcommerce?: boolean;

  @IsOptional()
  @IsBoolean()
  enableTransbank?: boolean;

  @IsOptional()
  @IsBoolean()
  enableIntegrations?: boolean;
}
