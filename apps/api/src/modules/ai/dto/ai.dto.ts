import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, Min, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAiProviderDto {
  @IsString()
  nome: string;

  @IsString()
  tipo: string;

  @IsOptional()
  @IsString()
  apiUrl?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsOptional()
  @IsString()
  base_url?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  secret_name?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateAiProviderDto extends CreateAiProviderDto {}

export class CreateAiModelDto {
  @IsOptional()
  @IsString()
  provedorId?: string;

  @IsOptional()
  @IsString()
  provedor_id?: string;

  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  identificador?: string;

  @IsOptional()
  @IsString()
  modeloId?: string;

  @IsOptional()
  @IsString()
  modelo_id?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateAiModelDto extends CreateAiModelDto {}

export class CreateAiCopilotDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  promptSistema?: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  system_prompt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  temperatura?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @IsString()
  categoria: string;

  @IsOptional()
  @IsString()
  cor?: string;

  @IsOptional()
  @IsString()
  modeloId?: string;

  @IsOptional()
  @IsString()
  modelo_id?: string;

  @IsOptional()
  @IsString()
  provedorId?: string;

  @IsOptional()
  @IsString()
  provedor_id?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateAiCopilotDto extends CreateAiCopilotDto {}

export class ChatMessageDto {
  @IsString()
  role: string;

  @IsString()
  content: string;
}

export class AiChatPayloadDto {
  @IsOptional()
  @IsString()
  copilot_id?: string;

  @IsOptional()
  @IsString()
  modelo_id?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}
