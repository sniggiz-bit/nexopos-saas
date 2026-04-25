import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class PriceTierDto {
    @ApiProperty({
        description: 'ID of the price tier (optional, for updates)',
        required: false,
    })
    id?: string;

    @ApiProperty({
        description: 'Minimum quantity to trigger this wholesale price',
        example: 6,
        minimum: 2,
    })
    @IsInt()
    @Min(2, { message: 'El tramo mínimo de precio mayorista debe ser al menos 2 unidades.' })
    minQuantity: number;

    @ApiProperty({
        description: 'Wholesale unit price in CLP',
        example: 8500,
        minimum: 0,
    })
    @IsInt()
    @Min(0)
    unitPrice: number;
}
