import { IsString, IsOptional, IsBoolean, IsArray, IsUUID, IsEnum, IsNumber, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTagDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  cor?: string;
}

export class CreateContatoDto {
  @IsEnum(['email', 'telefone', 'whatsapp', 'instagram', 'facebook', 'twitter', 'linkedin', 'outro'])
  tipo: string;

  @IsString()
  valor: string;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;
}

export class CreateEnderecoDto {
  @IsEnum(['residencial', 'comercial', 'eleitoral', 'outro'])
  tipo: string;

  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsString()
  logradouro?: string;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @IsString()
  complemento?: string;

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsOptional()
  @IsUUID()
  bairroId?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsUUID()
  municipioId?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;
}

export class CreatePapelDto {
  @IsString()
  papel: string;
}

export class CreatePessoaDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  nomeSocial?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsOptional()
  @IsString()
  tipoPessoa?: string;

  @IsOptional()
  @IsString()
  razaoSocial?: string;

  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @IsOptional()
  @IsString()
  tituloEleitor?: string;

  @IsOptional()
  @IsString()
  genero?: string;

  @IsOptional()
  @IsString()
  dataNascimento?: string;

  @IsOptional()
  @IsString()
  profissao?: string;

  @IsOptional()
  @IsEnum(['A', 'B', 'C', 'D', 'E'])
  classeSocial?: string;

  @IsOptional()
  @IsString()
  escolaridade?: string;

  @IsOptional()
  @IsString()
  nivelRelacionamento?: string;

  @IsOptional()
  @IsString()
  religiao?: string;

  @IsOptional()
  @IsEnum(['1_frio', '2_morno', '3_quente', '4_garantido'])
  nivelEngajamento?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  scoreTotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsBoolean()
  isLideranca?: boolean;

  @IsOptional()
  @IsUUID()
  liderancaId?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsArray()
  @Type(() => CreateContatoDto)
  contatos?: CreateContatoDto[];

  @IsOptional()
  @IsArray()
  @Type(() => CreateEnderecoDto)
  enderecos?: CreateEnderecoDto[];

  @IsOptional()
  @IsArray()
  @Type(() => CreatePapelDto)
  papeis?: CreatePapelDto[];
}

export class UpdatePessoaDto extends CreatePessoaDto {}

export class GerarSegmentacaoDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  nivelEngajamento?: string;

  @IsOptional()
  @IsString()
  profissao?: string;

  @IsOptional()
  @IsObject()
  idade?: { min?: number; max?: number };
}
