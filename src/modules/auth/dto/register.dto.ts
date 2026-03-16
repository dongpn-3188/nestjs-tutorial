import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe', minLength: 3, maxLength: 20 })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  @Length(3, 20, { message: i18nValidationMessage('validation.LENGTH') })
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsEmail({}, { message: i18nValidationMessage('validation.INVALID_EMAIL') })
  email: string;

  @ApiProperty({ example: '123456', minLength: 6, maxLength: 20 })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  @Length(6, 20, { message: i18nValidationMessage('validation.LENGTH') })
  password: string;
}
