import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { SALT_ROUNDS, PUBLIC_FOLDER, PRIVATE_FOLDER } from '../../common/constants';
import { SharedService } from '../../common/shared.service';
import type { Response } from 'express';
import type { Multer } from 'multer';

@Injectable()
export class UtilityService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sharedService: SharedService,
  ) {}

  private getDomain(): string {
    return (process.env.HOST || 'localhost') + ':' + (process.env.PORT || '3000');
  }

  async uploadImageForUser(file: Multer.File, isPublic: boolean, user: { userId: number; email: string }) {
    await this.usersService.checkUserExistOrThrow(user.userId);

    try {
      const url = await this.uploadImage(file, user.email, isPublic);
      if(isPublic) {
        return { url };
      }
      return { filename: url }; 
    } catch {
      throw new InternalServerErrorException({
        statusCode: 500,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage('message.UPLOAD_FAILED'),
      });
    }
  }

  private async uploadImage(file: Multer.File, email: string, isPublic: boolean): Promise<string> {    
    const targetDir = isPublic ? PUBLIC_FOLDER : PRIVATE_FOLDER;
    const ext = file.originalname.split('.').pop();
    const hash = await bcrypt.hash(email, SALT_ROUNDS);
    const safeHash = hash.replace(/[^a-zA-Z0-9]/g, '');
    const filename = `${safeHash}.${ext}`;
    const uploadDir = join(process.cwd(), targetDir);
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, filename);
    await fs.writeFile(filePath, file.buffer);
    if(isPublic) 
    {
      return `${this.getDomain()}/${targetDir}/${filename}`;
    }
    
    return filename; // Return filename for private files, which will be used to access the file later

  }

  async sendPrivateFile(filename: string, res: Response) {
    const filePath = join(process.cwd(), PRIVATE_FOLDER, filename);
    try {
      await fs.access(filePath, fs.constants.R_OK);
      return res.sendFile(filePath);
    } catch {
      throw new NotFoundException({
        statusCode: 404,
        errors: 'Not Found',
        message: this.sharedService.getSharedMessage('message.FILE_NOT_FOUND'),
      }); 
    }
  }
}
