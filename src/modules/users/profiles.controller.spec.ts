import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { UsersService } from './users.service';

describe('ProfilesController', () => {
  let controller: ProfilesController;

  const mockUsersService = {
    findProfileById: jest.fn(),
    follow: jest.fn(),
    unfollow: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return profile with optional authentication', async () => {
    const expected = {
      id: 2,
      username: 'jane',
      avatar: null,
      bio: null,
      following: true,
    };
    mockUsersService.findProfileById.mockResolvedValue(expected);

    const result = await controller.getProfile(2, { user: { userId: 1 } });

    expect(mockUsersService.findProfileById).toHaveBeenCalledWith(2, 1);
    expect(result).toEqual(expected);
  });

  it('should follow user', async () => {
    const expected = {
      id: 2,
      username: 'jane',
      following: true,
    };
    mockUsersService.follow.mockResolvedValue(expected);

    const result = await controller.follow(2, { user: { userId: 1 } });

    expect(mockUsersService.follow).toHaveBeenCalledWith(2, 1);
    expect(result).toEqual(expected);
  });

  it('should unfollow user', async () => {
    const expected = {
      id: 2,
      username: 'jane',
      following: false,
    };
    mockUsersService.unfollow.mockResolvedValue(expected);

    const result = await controller.unfollow(2, { user: { userId: 1 } });

    expect(mockUsersService.unfollow).toHaveBeenCalledWith(2, 1);
    expect(result).toEqual(expected);
  });
});
