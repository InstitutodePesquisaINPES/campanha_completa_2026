import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { AppRole } from '@prisma/client';

export class CreateEquipeUserDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsEnum(AppRole)
  role: AppRole;

  @IsOptional()
  @IsString()
  phone?: string;
  
  @IsOptional()
  @IsString()
  cpf?: string;
}

export class UpdateEquipeUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsEnum(AppRole)
  role?: AppRole;
  
  @IsOptional()
  @IsString()
  phone?: string;
  
  @IsOptional()
  @IsString()
  cpf?: string;
}
