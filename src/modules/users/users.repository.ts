import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User } from '../../database/Entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async isFollowingUser(followerId: number, followingId: number): Promise<boolean> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.following', 'following')
      .where('user.id = :followerId', { followerId })
      .andWhere('following.id = :followingId', { followingId })
      .getExists();
  }

  addFollowing(followerId: number, followingId: number): Promise<void> {
    return this.userRepository
      .createQueryBuilder()
      .relation(User, 'following')
      .of(followerId)
      .add(followingId);
  }

  removeFollowing(followerId: number, followingId: number): Promise<void> {
    return this.userRepository
      .createQueryBuilder()
      .relation(User, 'following')
      .of(followerId)
      .remove(followingId);
  }

  save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  findMailExists(email: string, id: number): Promise<boolean> {
    return this.userRepository.exists({ where: { email, id: Not(id) } });
  }

  findUserExists(id: number): Promise<boolean> {
    return this.userRepository.exists({ where: { id } });
  }

  async updateUser(user: User, updateUserDto: UpdateUserDto): Promise<User> {
    Object.assign(user, updateUserDto);
    return this.save(user);
  }
}
