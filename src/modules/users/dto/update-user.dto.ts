import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  @Length(3, 20, { message: i18nValidationMessage('validation.LENGTH') })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: i18nValidationMessage('validation.INVALID_EMAIL') })
  email?: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  @Length(6, 20, { message: i18nValidationMessage('validation.LENGTH') })
  password?: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  avatar?: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  bio?: string;
}
