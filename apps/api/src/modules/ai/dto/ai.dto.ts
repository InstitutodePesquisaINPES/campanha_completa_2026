import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, Min, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAiProviderDto {
  @IsString()
  nome: string;

  @IsString()
  tipo: string;

  @IsString()
  apiUrl: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateAiProviderDto extends CreateAiProviderDto {}

export class CreateAiModelDto {
  @IsString()
  provedorId: string;

  @IsString()
  nome: string;

  @IsString()
  identificador: string;

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
  @IsString()
  copilot_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}
