import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'john_doe', minLength: 3, maxLength: 20 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  @Length(3, 20, { message: i18nValidationMessage('validation.LENGTH') })
  username?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail({}, { message: i18nValidationMessage('validation.INVALID_EMAIL') })
  email?: string;

  @ApiPropertyOptional({ example: '123456', minLength: 6, maxLength: 20 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  @Length(6, 20, { message: i18nValidationMessage('validation.LENGTH') })
  password?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  avatar?: string;

  @ApiPropertyOptional({ example: 'I am a backend developer.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  bio?: string;
}
