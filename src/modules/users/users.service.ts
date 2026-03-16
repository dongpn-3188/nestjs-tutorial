import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../../database/Entities/user.entity';
import { UsersRepository } from './users.repository';
import { SharedService } from '../../common/shared.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly sharedService: SharedService,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.findAll();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(
        this.sharedService.getSharedMessage('message.USER_NOT_FOUND'),
      );
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const userExist = await this.usersRepository.findById(id);
    if (!userExist) {
      throw new NotFoundException(
        this.sharedService.getSharedMessage('message.USER_NOT_FOUND'),
      );
    }

    if(updateUserDto.email) {
      const emailExist = await this.usersRepository.findByEmail(updateUserDto.email);
      if(emailExist && emailExist.id !== id) {
        throw new BadRequestException(
          this.sharedService.getSharedMessage('message.EMAIL_ALREADY_EXISTS', {
            args: { email: updateUserDto.email },
          }),
        );
      }
    }

    if(updateUserDto.password) {    
      const hashedPassword = await bcrypt.hash(
        updateUserDto.password,
        10,
      );
      updateUserDto.password = hashedPassword;
    }

    const updatedUser = await this.usersRepository.updateById(id, updateUserDto);
    if (!updatedUser) {
      throw new InternalServerErrorException(
        this.sharedService.getSharedMessage('message.USER_UPDATE_FAILED'),
      );
    }
    return updatedUser;
  }
}
