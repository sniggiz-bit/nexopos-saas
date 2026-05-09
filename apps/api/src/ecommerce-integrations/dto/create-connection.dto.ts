import {
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';

export enum EcommercePlatformDto {
  SHOPIFY = 'SHOPIFY',
  WOOCOMMERCE = 'WOOCOMMERCE',
}

export class CreateConnectionDto {
  @IsEnum(EcommercePlatformDto)
  platform: EcommercePlatformDto;

  @IsString()
  @IsNotEmpty()
  name: string;

  // Shopify
  @ValidateIf((o) => o.platform === EcommercePlatformDto.SHOPIFY)
  @IsString()
  @IsNotEmpty()
  shopDomain?: string;

  @ValidateIf((o) => o.platform === EcommercePlatformDto.SHOPIFY)
  @IsString()
  @IsNotEmpty()
  accessToken?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  // WooCommerce
  @ValidateIf((o) => o.platform === EcommercePlatformDto.WOOCOMMERCE)
  @IsUrl()
  siteUrl?: string;

  @ValidateIf((o) => o.platform === EcommercePlatformDto.WOOCOMMERCE)
  @IsString()
  @IsNotEmpty()
  consumerKey?: string;

  @ValidateIf((o) => o.platform === EcommercePlatformDto.WOOCOMMERCE)
  @IsString()
  @IsNotEmpty()
  consumerSecret?: string;

  // Sync options
  @IsOptional()
  @IsBoolean()
  syncProducts?: boolean;

  @IsOptional()
  @IsBoolean()
  syncInventory?: boolean;

  @IsOptional()
  @IsBoolean()
  syncOrders?: boolean;

  @IsOptional()
  @IsBoolean()
  syncCustomers?: boolean;

  @IsOptional()
  @IsBoolean()
  autoCreateSale?: boolean;
}
