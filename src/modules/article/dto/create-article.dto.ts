import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ArrayUnique,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
export class CreateArticleDto {
  @ApiProperty({ example: 'How to build NestJS module' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  title: string;
  @ApiProperty({ example: 'A short description for the article' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  description: string;
  @ApiProperty({ example: 'This is full article body content' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  body: string;
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
