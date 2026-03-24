import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateCommentDto {
  @ApiProperty({ example: 'This is a comment body' })
  @IsString({ message: i18nValidationMessage('validation.STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  body: string;
}
