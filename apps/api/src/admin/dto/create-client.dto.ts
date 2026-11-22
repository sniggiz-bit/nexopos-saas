import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsRut } from '../../common/decorators/is-rut.decorator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const optionalText = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() || undefined : value;

export class CreateClientDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(150)
  companyName: string;

  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(150)
  userName: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() @MaxLength(254)
  email: string;

  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(30)
  phone: string;

  @IsString() @MinLength(8) @MaxLength(72)
  password: string;

  @Transform(optionalText) @IsOptional() @IsString() @IsRut() @MaxLength(30)
  rut?: string;

  @Transform(optionalText) @IsOptional() @IsString() @MaxLength(150)
  giro?: string;

  @Transform(optionalText) @IsOptional() @IsString() @MaxLength(300)
  address?: string;
}
