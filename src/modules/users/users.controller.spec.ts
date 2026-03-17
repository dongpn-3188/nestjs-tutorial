import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return current user profile by req.user.userId', async () => {
      const req = { user: { userId: 1 } };
      const expected = { id: 1, username: 'john', email: 'john@example.com' };
      mockUsersService.findOne.mockResolvedValue(expected);

      const result = await controller.getCurrentUser(req);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile by id', async () => {
      const expected = { id: 2, username: 'jane', email: 'jane@example.com' };
      mockUsersService.findOne.mockResolvedValue(expected);

      const result = await controller.getUserProfile(2);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(2);
      expect(result).toEqual(expected);
    });
  });

  describe('updateUserById', () => {
    it('should update current user profile', async () => {
      const req = { user: { userId: 1 } };
      const updateDto = { bio: 'Hello everyone' };
      const expected = {
        id: 1,
        username: 'john',
        email: 'john@example.com',
        bio: 'Hello everyone',
      };
      mockUsersService.update.mockResolvedValue(expected);

      const result = await controller.updateUserById(updateDto, req);

      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(expected);
    });
  });
});
