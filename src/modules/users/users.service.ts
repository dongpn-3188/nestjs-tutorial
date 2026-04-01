import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { User } from '../../database/Entities/user.entity';
import { UsersRepository } from './users.repository';
import { SharedService } from '../../common/shared.service';
import * as bcrypt from 'bcryptjs';
import { UserSerializer } from './serializers/user.serializer';
import { UpdateUserDto } from './dto/update-user.dto';
import { SALT_ROUNDS } from '../../common/constants';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly sharedService: SharedService,
    private readonly mailService: MailService,
    private readonly logger: Logger,
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

  private async validateTargetFollowUser(
    targetUserId: number,
    currentUserId: number,
  ): Promise<void> {
    if (targetUserId === currentUserId) {
      throw new BadRequestException(
        this.sharedService.getSharedMessage(
          'message.CANNOT_FOLLOW_OR_UNFOLLOW_YOURSELF',
        ),
      );
    }

    await this.checkUserExistOrThrow(targetUserId);
  }

  async follow(targetUserId: number, currentUserId: number) {
    await this.validateTargetFollowUser(targetUserId, currentUserId);
    let isModifyDatabase = false;

    try {
      const hasFollowed = await this.usersRepository.isFollowingUser(
        currentUserId,
        targetUserId,
      )

      if (!hasFollowed) {
        await this.usersRepository.addFollowing(currentUserId, targetUserId);
        isModifyDatabase = true;
      }
    } catch {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage('message.USER_FOLLOW_FAILED'),
      });
    }

    const targetUser = await this.loadUserOrThrow(targetUserId);
    if(isModifyDatabase) {
      try {
        const currentUser = await this.loadUserOrThrow(currentUserId);
        await this.mailService.sendFollowUpEmail({
          followUser: currentUser.username, 
          targetUser: targetUser.username,
          targetEmail: targetUser.email,
        });
      } catch (error) {
        this.logger.error(
          'Failed to send follow-up email',
          {
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            processName: 'follow-up',
          },
        ); // Log the error but do not throw, since the main action (follow) is successful
      }
    }

    return this.serializeProfile(targetUser, currentUserId);
  }

  async unfollow(targetUserId: number, currentUserId: number) {
    await this.validateTargetFollowUser(targetUserId, currentUserId);

    try {
      const hasFollowed = await this.usersRepository.isFollowingUser(
        currentUserId,
        targetUserId,
      );

      if (hasFollowed) {
        await this.usersRepository.removeFollowing(currentUserId, targetUserId);
      }
    } catch {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage('message.USER_UNFOLLOW_FAILED'),
      });
    }

    const targetUser = await this.loadUserOrThrow(targetUserId);
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
