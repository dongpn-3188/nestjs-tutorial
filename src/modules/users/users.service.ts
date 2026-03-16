import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../../database/entities/user.entity';
import { UsersRepository } from './users.repository';
import { SharedService } from '../../common/shared.service';
import * as bcrypt from 'bcryptjs';
import { UserSerializer } from './serializers/user.serializer';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly sharedService: SharedService,
  ) {}

  async loadUserOrThrow(id: number): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(
        this.sharedService.getSharedMessage('message.USER_NOT_FOUND'),
      );
    }
    return user;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.usersRepository.findByEmail(email);
    return !!user;
  }

  async findOne(id: number) {
    const user = await this.loadUserOrThrow(id);
    return new UserSerializer(user, { type: 'BASIC_INFO' }).serialize();
  }

  async update(id: number, data: Partial<User>) {
    const userExist = await this.loadUserOrThrow(id);

    if (data.email && data.email !== userExist.email) {
      const emailExist = await this.checkEmailExists(data.email);
      if (emailExist && data.email !== userExist.email) {
        throw new BadRequestException(
          this.sharedService.getSharedMessage('message.EMAIL_ALREADY_EXISTS'),
        );
      }
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      data.password = hashedPassword;
    }

    try {
      const updatedUser = await this.usersRepository.updateById(id, data);
      return new UserSerializer(updatedUser, { type: 'BASIC_INFO' }).serialize();
    } catch {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        errors: 'Not Found',
        message: this.sharedService.getSharedMessage('message.USER_NOT_FOUND'),
      };
    }
  }
}
