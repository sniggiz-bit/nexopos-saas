import { IsString, IsDecimal, IsEnum, IsOptional } from 'class-validator';
import { MovementType } from '@prisma/client';

export class CreateMovementDto {
  @IsString()
  productId: string;

  @IsString()
  branchId: string;

  @IsDecimal() // Or IsNumber, but Decimal is safer for money/stock
  quantity: number;

  @IsEnum(MovementType)
  type: MovementType;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
