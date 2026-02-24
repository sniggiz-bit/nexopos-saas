import { IsInt, IsOptional, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/**
 * DTO for updating an existing product
 * All fields are optional
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
}
