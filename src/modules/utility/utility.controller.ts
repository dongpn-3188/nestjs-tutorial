import { Controller, Post, UploadedFile, ParseFilePipeBuilder, UseInterceptors, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UtilityService } from './utility.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MAX_FILE_SIZE } from '../../common/constants';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class UtilityController {
  constructor(
    private readonly utilityService: UtilityService
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_FILE_SIZE * 1024 * 1024 }, // Giới hạn kích thước file
  }))
  @ApiOperation({ summary: 'Upload an image for the authenticated user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadImage(@UploadedFile(
    new ParseFilePipeBuilder()
      .addFileTypeValidator({ fileType: 'jpeg|png|jpg' }) // Validates MIME type
      .build({ fileIsRequired: true }),    

  ) file: Express.Multer.File, @Req() req) {
    return this.utilityService.uploadImageForUser(file, req.user);
  }
}
