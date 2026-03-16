import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        { id: 1, username: 'john', email: 'john@example.com' },
        { id: 2, username: 'jane', email: 'jane@example.com' },
      ];
      mockUsersRepository.findAll.mockResolvedValue(users);

      const result = await service.findAll();

      expect(mockUsersRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });
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

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should return updated user when user exists', async () => {
      const updateDto = { username: 'john-new' };
      const updatedUser = {
        id: 1,
        username: 'john-new',
        email: 'john@example.com',
      };
      mockUsersRepository.updateById.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(mockUsersRepository.updateById).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersRepository.updateById.mockResolvedValue(null);

      await expect(service.update(1, { username: 'john-new' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
