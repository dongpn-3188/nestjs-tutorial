import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { MAX_FILE_SIZE, SALT_ROUNDS } from '../../common/constants';
import { SharedService } from '../../common/shared.service';

@Injectable()
export class UtilityService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sharedService: SharedService,
  ) {}

  async uploadImageForUser(file: Express.Multer.File, user: { userId: number; email: string }) {
    //this.validateFile(file);
    await this.usersService.checkUserExistOrThrow(user.userId);

    try {
      const url = await this.uploadImage(file, user.email);
      return { url };
    } catch {
      throw new InternalServerErrorException({
        statusCode: 500,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage('message.UPLOAD_FAILED'),
      });
    }
  }

  /*
  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(this.sharedService.getSharedMessage('message.NO_FILE_UPLOADED'));
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(this.sharedService.getSharedMessage('message.INVALID_FILE_TYPE'));
    }
    if (file.size > MAX_FILE_SIZE * 1024 * 1024) {
      throw new BadRequestException(this.sharedService.getSharedMessage('message.FILE_TOO_LARGE', { args: { max: MAX_FILE_SIZE } }));
    }
  }
  */

  private async uploadImage(file: Express.Multer.File, email: string): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const hash = await bcrypt.hash(email, SALT_ROUNDS);
    const safeHash = hash.replace(/[^a-zA-Z0-9]/g, '');
    const filename = `${safeHash}.${ext}`;
    const uploadDir = join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, filename);
    await fs.writeFile(filePath, file.buffer);
    return `/uploads/${filename}`;
  }
}
