import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
export class GetArticleDto {
  @ApiPropertyOptional({ example: 'nestjs' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  tag?: string;
  @ApiPropertyOptional({ example: 'john_doe' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  author?: string;
  @ApiPropertyOptional({ example: 'jane_doe' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  favorited?: string;
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  itemCount?: number;
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number;
}
