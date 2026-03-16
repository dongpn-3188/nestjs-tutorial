import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpStatus, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { SharedService } from '../../common/shared.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    updateById: jest.fn(),
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
      mockUsersRepository.updateById.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(mockUsersRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUsersRepository.updateById).toHaveBeenCalledWith(1, updateDto);
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
      expect(mockUsersRepository.updateById).not.toHaveBeenCalled();
      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith('message.USER_NOT_FOUND');
    });

    it('should throw BadRequestException when email already exists', async () => {
      mockUsersRepository.findById.mockResolvedValue({
        id: 1,
        username: 'john',
        email: 'john@example.com',
      });
      mockUsersRepository.findByEmail.mockResolvedValue({
        id: 2,
        username: 'jane',
        email: 'jane@example.com',
      });
      mockSharedService.getSharedMessage.mockReturnValue('Email already exists');

      await expect(service.update(1, { email: 'jane@example.com' })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUsersRepository.findByEmail).toHaveBeenCalledWith('jane@example.com');
      expect(mockUsersRepository.updateById).not.toHaveBeenCalled();
      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith('message.EMAIL_ALREADY_EXISTS');
    });

    it('should return error response when update fails unexpectedly', async () => {
      mockUsersRepository.findById.mockResolvedValue({
        id: 1,
        username: 'john',
        email: 'john@example.com',
      });
      mockUsersRepository.updateById.mockRejectedValue(new Error('db error'));
      mockSharedService.getSharedMessage.mockReturnValue('User not found');

      const result = await service.update(1, { username: 'john-new' });

      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        errors: 'Not Found',
        message: 'User not found',
      });
      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith('message.USER_NOT_FOUND');
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
      mockUsersRepository.updateById.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(mockBcryptHash).toHaveBeenCalledWith('plain-password', 10);
      expect(mockUsersRepository.updateById).toHaveBeenCalledWith(1, {
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
});
