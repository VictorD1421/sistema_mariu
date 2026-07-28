import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateChatbotDto {
  @IsString()
  @IsNotEmpty()
  trigger_text!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  is_video?: boolean;

  @IsNumber()
  @IsOptional()
  parentId?: number; // Para crear sub-preguntas
}