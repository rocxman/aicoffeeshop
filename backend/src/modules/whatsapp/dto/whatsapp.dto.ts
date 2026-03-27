import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class WhatsAppWebhookDto {
  @IsString()
  @IsNotEmpty()
  mode: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  challenge?: string;
}

export class WhatsAppMessageDto {
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class WhatsAppTemplateDto {
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsObject()
  @IsOptional()
  parameters?: Record<string, string>;
}
