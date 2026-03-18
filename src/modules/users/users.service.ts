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

  async loadByIdWithFollowingOrThrow(id: number): Promise<User> {
    const user = await this.usersRepository.findByIdWithFollowing(id);
    if (!user) {
      throw new NotFoundException(
        this.sharedService.getSharedMessage('message.USER_NOT_FOUND'),
      );
    }
    return user;
  }

  private async isFollowingUser(
    currentUserId: number | undefined,
    targetUserId: number,
  ): Promise<boolean> {
    if (!currentUserId || currentUserId === targetUserId) {
      return false;
    }

    return this.usersRepository.isFollowingUser(currentUserId, targetUserId);
  }

  private async serializeProfile(user: User, currentUserId?: number) {
    const following = await this.isFollowingUser(currentUserId, user.id);
    return new UserSerializer(
      { ...user, following },
      { type: 'PROFILE' },
    ).serialize();
  }

  async checkUserExistOrThrow(id: number): Promise<void> {
    const userExist = await this.usersRepository.findUserExists(id);
    if (!userExist) {
      throw new NotFoundException(
        this.sharedService.getSharedMessage('message.USER_NOT_FOUND'),
      );
    }
  }

  async checkEmailExistsOrThrow(email: string, id: number): Promise<void> {
    const emailExist = await this.usersRepository.findMailExists(email, id);
    if (emailExist) {
      throw new BadRequestException(
        this.sharedService.getSharedMessage('message.EMAIL_ALREADY_EXISTS'),
      );
    }
  }

  async findOne(id: number) {
    const user = await this.loadUserOrThrow(id);
    return new UserSerializer(user, { type: 'BASIC_INFO' }).serialize();
  }

  async findProfileById(targetUserId: number, currentUserId?: number) {
    const user = await this.loadUserOrThrow(targetUserId);
    return this.serializeProfile(user, currentUserId);
  }

  async follow(targetUserId: number, currentUserId: number) {
    const targetUser = await this.loadUserOrThrow(targetUserId);

    if (targetUser.id === currentUserId) {
      throw new BadRequestException(
        this.sharedService.getSharedMessage('message.CANNOT_FOLLOW_YOURSELF'),
      );
    }

    const currentUserWithFollowing = await this.loadByIdWithFollowingOrThrow(currentUserId);

    const hasFollowed = currentUserWithFollowing.following?.some(
      (user) => user.id === targetUser.id,
    );

    if (!hasFollowed) {
      currentUserWithFollowing.following = [
        ...(currentUserWithFollowing.following || []),
        targetUser,
      ];
      await this.usersRepository.save(currentUserWithFollowing);
    }

    return this.serializeProfile(targetUser, currentUserId);
  }

  async unfollow(targetUserId: number, currentUserId: number) {
    const targetUser = await this.loadUserOrThrow(targetUserId);
    const currentUserWithFollowing = await this.loadByIdWithFollowingOrThrow(currentUserId);

    currentUserWithFollowing.following = (currentUserWithFollowing.following || []).filter(
      (user) => user.id !== targetUser.id,
    );
    await this.usersRepository.save(currentUserWithFollowing);

    return this.serializeProfile(targetUser, currentUserId);
  }

  async update(id: number, data: UpdateUserDto) {
    const userExist = await this.loadUserOrThrow(id);

    if (data.email) {
      await this.checkEmailExistsOrThrow(data.email, id);
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
