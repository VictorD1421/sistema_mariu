import { IsNotEmpty, IsString, IsEnum, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @IsString()
  @IsNotEmpty()
  last_name!: string;


  @IsEnum(['ADMIN', 'SUPERUSER', 'USER'])
  @IsOptional()
  role?: 'ADMIN' | 'USER' | 'SUPERUSER';
}