import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsIn, IsISO8601, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class ClientProfileDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(150) name?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(30) rut?: string;
  @IsOptional() @IsString() @MaxLength(150) giro?: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
  @IsOptional() @IsIn(['ACTIVE', 'PAST_DUE', 'CANCELED']) billingStatus?: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  @IsOptional() @IsISO8601() nextPayment?: string | null;
}
export class ClientUserDto {
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsOptional() @IsIn(['TENANT_ADMIN', 'MANAGER', 'CASHIER']) role?: 'TENANT_ADMIN' | 'MANAGER' | 'CASHIER';
  @IsOptional() @IsString() @MaxLength(128) branchId?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(72) password?: string;
}
export class ClientBranchDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
  @IsOptional() @IsBoolean() isMain?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
class ModuleDecisionDto {
  @IsString() @MaxLength(128) moduleId: string;
  @IsOptional() @IsBoolean() enabled: boolean | null;
}
export class ClientModulesDto {
  @IsArray() @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => ModuleDecisionDto)
  overrides: ModuleDecisionDto[];
}
export class DeleteClientDto {
  @IsString() @MaxLength(200) confirmation: string;
  @IsString() @MinLength(1) @MaxLength(72) password: string;
}
export class DeleteClientUserDto {
  @IsString() @MaxLength(254) confirmation: string;
}
