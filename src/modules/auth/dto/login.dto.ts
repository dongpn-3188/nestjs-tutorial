import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsEmail({}, { message: i18nValidationMessage('validation.INVALID_EMAIL') })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  password: string;
}
