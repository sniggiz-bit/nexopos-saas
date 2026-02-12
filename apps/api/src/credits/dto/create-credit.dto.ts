
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCreditDto {
    @IsString()
    tenantId: string;

    @IsString()
    customerId: string;

    @IsOptional()
    @IsString()
    saleId?: string;

    @IsNumber()
    @Min(0)
    totalAmount: number;

    @IsNumber()
    @Min(0)
    balance: number;
}
