import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
} from 'class-validator';
import { IsRut } from '../../common/decorators/is-rut.decorator';

export class RegisterTenantDto {
  @IsNotEmpty({ message: 'El nombre de la empresa es requerido' })
  @IsString()
  companyName: string;

  @IsNotEmpty({ message: 'Tu nombre es requerido' })
  @IsString()
  userName: string;

  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @IsString()
  phone: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsOptional()
  @IsRut({ message: 'RUT inválido' })
  @IsString()
  rut?: string;

  @IsOptional()
  @IsString()
  giro?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
