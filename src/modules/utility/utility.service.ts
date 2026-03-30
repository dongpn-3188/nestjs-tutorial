import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { SALT_ROUNDS } from '../../common/constants';
import { SharedService } from '../../common/shared.service';

@Injectable()
export class UtilityService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sharedService: SharedService,
  ) {}

  async uploadImageForUser(file: Express.Multer.File, user: { userId: number; email: string }) {
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
