import { Controller, Post, UploadedFile, ParseFilePipeBuilder, UseInterceptors, UseGuards, Req, Body, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UtilityService } from './utility.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MAX_FILE_SIZE } from '../../common/constants';
import type { Response } from 'express';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class UtilityController {
  constructor(
    private readonly utilityService: UtilityService
  ) {}

  @Post('upload')
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
        isPublic: {
          type: 'boolean',
          description: 'Public file or not',
        },
      },
      required: ['file', 'isPublic'],
    },
  })
  async uploadImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: 'jpeg|png|jpg' }) // Validates MIME type
        .build({ fileIsRequired: true }),    
      ) 
      file: Express.Multer.File, 
      @Body('isPublic') isPublic: string,
      @Req() req, 
  ) {
    const isPublicBool = typeof isPublic === 'string' ? isPublic === 'true' : !!isPublic;
    return this.utilityService.uploadImageForUser(file, isPublicBool, req.user);
  }


  @Get('download/:filename')
  async getPrivateFile(@Param('filename') filename: string, @Res() res: Response) {
    return this.utilityService.sendPrivateFile(filename, res);
  }
}
