import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../../database/Entities/user.entity';
import { UsersRepository } from './users.repository';
import { SharedService } from '../../common/shared.service';
import * as bcrypt from 'bcryptjs';
import { UserSerializer } from './serializers/user.serializer';
import { UpdateUserDto } from './dto/update-user.dto';
import { SALT_ROUNDS } from '../../common/constants';

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

  async update(id: number, data: UpdateUserDto) {
    const userExist = await this.loadUserOrThrow(id);

    if (data.email) {
      const emailExist = await this.checkEmailExists(data.email);
      if (emailExist && data.email !== userExist.email) {
        throw new BadRequestException(
          this.sharedService.getSharedMessage('message.EMAIL_ALREADY_EXISTS'),
        );
      }
    }

    try {
      const updateData: Partial<UpdateUserDto> = { ...data };
      if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
        updateData.password = hashedPassword;
      }
      const updatedUser = await this.usersRepository.updateUser(userExist, updateData);
      return new UserSerializer(updatedUser, { type: 'BASIC_INFO' }).serialize();
    } catch {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage('message.USER_UPDATE_FAILED'),
      });
    }
  }
}
