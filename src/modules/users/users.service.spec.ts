import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { SharedService } from '../../common/shared.service';
import * as bcrypt from 'bcryptjs';
import { SALT_ROUNDS } from '../../common/constants';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepository = {
    findById: jest.fn(),
    findByIdWithFollowing: jest.fn(),
    isFollowingUser: jest.fn(),
    save: jest.fn(),
    findUserExists: jest.fn(),
    findMailExists: jest.fn(),
    updateUser: jest.fn(),
  };

  const mockSharedService = {
    getSharedMessage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: SharedService,
          useValue: mockSharedService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findOne', () => {
    it('should return user when user exists', async () => {
      const user = { id: 1, username: 'john', email: 'john@example.com' };
      mockUsersRepository.findById.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(mockUsersRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);
      mockSharedService.getSharedMessage.mockReturnValue('User not found');

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith('message.USER_NOT_FOUND');
    });

  });

  describe('checkUserExistOrThrow', () => {
    it('should not throw when user exists', async () => {
      mockUsersRepository.findUserExists.mockResolvedValue(true);

      await expect(service.checkUserExistOrThrow(1)).resolves.toBeUndefined();
      expect(mockUsersRepository.findUserExists).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersRepository.findUserExists.mockResolvedValue(false);
      mockSharedService.getSharedMessage.mockReturnValue('User not found');

      await expect(service.checkUserExistOrThrow(1)).rejects.toThrow(NotFoundException);
      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith('message.USER_NOT_FOUND');
    });
  });

  describe('update', () => {
    it('should return updated user when user exists', async () => {
      const updateDto = { username: 'john-new' };
      const existingUser = { id: 1, username: 'john', email: 'john@example.com' };
      const updatedUser = {
        id: 1,
        username: 'john-new',
        email: 'john@example.com',
        avatar: null,
        bio: null,
        password: 'secret',
      };
      mockUsersRepository.findById.mockResolvedValue(existingUser);
      mockUsersRepository.updateUser.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(mockUsersRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUsersRepository.updateUser).toHaveBeenCalledWith(existingUser, updateDto);
      expect(result).toEqual({
        id: 1,
        username: 'john-new',
        email: 'john@example.com',
        avatar: null,
        bio: null,
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);
      mockSharedService.getSharedMessage.mockReturnValue('User not found');

      await expect(service.update(1, { username: 'john-new' })).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersRepository.updateUser).not.toHaveBeenCalled();
      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith('message.USER_NOT_FOUND');
    });

    it('should throw BadRequestException when email already exists', async () => {
      mockUsersRepository.findById.mockResolvedValue({
        id: 1,
        username: 'john',
        email: 'john@example.com',
      });
      mockUsersRepository.findMailExists.mockResolvedValue(true);
      mockSharedService.getSharedMessage.mockReturnValue('Email already exists');

      await expect(service.update(1, { email: 'jane@example.com' })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUsersRepository.findMailExists).toHaveBeenCalledWith('jane@example.com', 1);
      expect(mockUsersRepository.updateUser).not.toHaveBeenCalled();
      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith('message.EMAIL_ALREADY_EXISTS');
    });

    it('should throw InternalServerErrorException when update fails unexpectedly', async () => {
      mockUsersRepository.findById.mockResolvedValue({
        id: 1,
        username: 'john',
        email: 'john@example.com',
      });
      mockUsersRepository.updateUser.mockRejectedValue(new Error('db error'));
      mockSharedService.getSharedMessage.mockReturnValue('Failed to update user');

      await expect(service.update(1, { username: 'john-new' })).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith('message.USER_UPDATE_FAILED');
    });

    it('should hash password before update', async () => {
      const mockBcryptHash = bcrypt.hash as unknown as jest.Mock;
      mockBcryptHash.mockResolvedValue('hashed-password');
      const updateDto = { password: 'plain-password' };
      const updatedUser = {
        id: 1,
        username: 'john',
        email: 'john@example.com',
        avatar: null,
        bio: null,
        password: 'hashed-password',
      };

      mockUsersRepository.findById.mockResolvedValue({
        id: 1,
        username: 'john',
        email: 'john@example.com',
      });
      mockUsersRepository.updateUser.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(mockBcryptHash).toHaveBeenCalledWith('plain-password', SALT_ROUNDS);
      expect(mockUsersRepository.updateUser).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        username: 'john',
        email: 'john@example.com',
      }), {
        password: 'hashed-password',
      });
      expect(result).toEqual({
        id: 1,
        username: 'john',
        email: 'john@example.com',
        avatar: null,
        bio: null,
      });
    });
  });

  describe('findProfileById', () => {
    it('should return profile with following=true when current user follows target user', async () => {
      mockUsersRepository.findById.mockResolvedValue({
        id: 2,
        username: 'jane',
        avatar: null,
        bio: null,
      });
      mockUsersRepository.isFollowingUser.mockResolvedValue(true);

      const result = await service.findProfileById(2, 1);

      expect(mockUsersRepository.findById).toHaveBeenCalledWith(2);
      expect(mockUsersRepository.isFollowingUser).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual({
        id: 2,
        username: 'jane',
        avatar: null,
        bio: null,
        following: true,
      });
    });
  });

  describe('follow', () => {
    it('should add target user to current user following list', async () => {
      const targetUser = { id: 2, username: 'jane', avatar: null, bio: null };
      const currentUser = { id: 1, following: [] };
      const savedCurrentUser = { id: 1, following: [targetUser] };

      mockUsersRepository.findById.mockResolvedValue(targetUser);
      mockUsersRepository.findByIdWithFollowing.mockResolvedValueOnce(currentUser);
      mockUsersRepository.save.mockResolvedValue(savedCurrentUser);
      mockUsersRepository.isFollowingUser.mockResolvedValue(true);

      const result = await service.follow(2, 1);

      expect(mockUsersRepository.save).toHaveBeenCalledWith({
        id: 1,
        following: [targetUser],
      });
      expect(result.following).toBe(true);
    });

    it('should throw when user follows themselves', async () => {
      mockUsersRepository.findById.mockResolvedValue({
        id: 1,
        username: 'john',
      });

      await expect(service.follow(1, 1)).rejects.toThrow(BadRequestException);
      expect(mockUsersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('unfollow', () => {
    it('should remove target user from following list', async () => {
      const targetUser = { id: 2, username: 'jane', avatar: null, bio: null };
      const currentUser = {
        id: 1,
        following: [targetUser, { id: 3, username: 'mike', avatar: null, bio: null }],
      };
      const savedCurrentUser = {
        id: 1,
        following: [{ id: 3, username: 'mike', avatar: null, bio: null }],
      };

      mockUsersRepository.findById.mockResolvedValue(targetUser);
      mockUsersRepository.findByIdWithFollowing.mockResolvedValueOnce(currentUser);
      mockUsersRepository.save.mockResolvedValue(savedCurrentUser);
      mockUsersRepository.isFollowingUser.mockResolvedValue(false);

      const result = await service.unfollow(2, 1);

      expect(mockUsersRepository.save).toHaveBeenCalledWith(savedCurrentUser);
      expect(result.following).toBe(false);
    });
  });
});
