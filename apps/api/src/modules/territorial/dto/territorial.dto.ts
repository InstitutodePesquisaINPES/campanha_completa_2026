import { IsString, IsOptional, IsNumber, IsUUID, IsBoolean, IsObject } from 'class-validator';

export class CreateMunicipioDto {
  @IsString()
  nome: string;

  @IsString()
  @IsUUID()
  estadoId: string;

  @IsOptional()
  @IsString()
  codigoIbge?: string;

  @IsOptional()
  @IsNumber()
  populacao?: number;

  @IsOptional()
  @IsNumber()
  eleitorado?: number;

  @IsOptional()
  @IsString()
  perfilSocioeconomico?: string;
}

export class UpdateMunicipioDto extends CreateMunicipioDto {}

export class CreateBairroDto {
  @IsString()
  nome: string;

  @IsString()
  @IsUUID()
  municipioId: string;

  @IsOptional()
  @IsNumber()
  populacaoEstimada?: number;

  @IsOptional()
  @IsNumber()
  eleitoradoEstimado?: number;

  @IsOptional()
  @IsString()
  perfilDemografico?: string;
}

export class UpdateBairroDto extends CreateBairroDto {}

export class CreateZonaDto {
  @IsString()
  numero: string;

  @IsString()
  @IsUUID()
  municipioId: string;

  @IsOptional()
  @IsNumber()
  eleitorado?: number;

  @IsOptional()
  @IsString()
  enderecoCartorio?: string;
}

export class CreateSecaoDto {
  @IsString()
  numero: string;

  @IsString()
  @IsUUID()
  zonaId: string;

  @IsString()
  @IsUUID()
  bairroId: string;

  @IsOptional()
  @IsString()
  localVotacao?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsNumber()
  eleitorado?: number;
}

export class CreateAreaAtuacaoDto {
  @IsString()
  nome: string;

  @IsString()
  @IsUUID()
  municipioId: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}
