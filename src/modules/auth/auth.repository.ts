import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/Entities/user.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.exists({ where: { email } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async createUser(registerDto: RegisterDto, hashedPassword: string): Promise<User> {
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }
}
