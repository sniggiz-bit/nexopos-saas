
import { IsNumber, IsString, IsOptional, Min, IsEnum } from 'class-validator';

// Assuming PaymentMethod enum matches the one in schema or similar
enum PaymentMethod {
    EFECTIVO = 'EFECTIVO',
    DEBITO = 'DEBITO',
    CREDITO = 'CREDITO',
    TRANSFERENCIA = 'TRANSFERENCIA',
}

export class AddPaymentDto {
    @IsNumber()
    @Min(1)
    amount: number;

    @IsEnum(PaymentMethod)
    paymentMethod: string;

    @IsOptional()
    @IsString()
    cashShiftId?: string;
}
