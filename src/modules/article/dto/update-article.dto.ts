import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateArticleDto {
  @ApiPropertyOptional({ example: 'How to build NestJS module' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  title?: string;

  @ApiPropertyOptional({ example: 'A short description for the article' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  description?: string;

  @ApiPropertyOptional({ example: 'This is full article body content' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  body?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['nestjs', 'typescript'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true, message: i18nValidationMessage('validation.STRING') })
  tagList?: string[];
}
