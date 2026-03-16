import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { SharedService } from '../../common/shared.service';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly sharedService: SharedService,
  ) {}

  findById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async updateById(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(
        this.sharedService.getSharedMessage('message.USER_NOT_FOUND'),
      );
    }

    Object.assign(user, updateUserDto);
    return this.save(user);
  }
}
