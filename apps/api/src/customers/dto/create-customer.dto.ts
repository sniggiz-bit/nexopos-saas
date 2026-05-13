import { IsString, IsOptional, IsEmail } from 'class-validator';
import { IsRut } from '../../common/decorators/is-rut.decorator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsRut({ message: 'RUT del cliente inválido' })
  @IsString()
  rut: string;

  @IsOptional()
  @IsString()
  giro?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  comuna?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;
}
