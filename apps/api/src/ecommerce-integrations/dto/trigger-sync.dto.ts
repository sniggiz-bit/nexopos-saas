import { IsEnum, IsOptional } from 'class-validator';

export enum SyncTypeDto {
  PRODUCTS = 'PRODUCTS',
  INVENTORY = 'INVENTORY',
  ORDERS = 'ORDERS',
  FULL = 'FULL',
}

export class TriggerSyncDto {
  @IsEnum(SyncTypeDto)
  @IsOptional()
  type?: SyncTypeDto = SyncTypeDto.FULL;
}
