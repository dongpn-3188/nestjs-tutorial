import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should call authService.register and return token', async () => {
      const registerDto = {
        username: 'john',
        email: 'john@example.com',
        password: '123456',
      };
      const expected = { accessToken: 'jwt-token' };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should call authService.login and return token', async () => {
      const loginDto = {
        email: 'john@example.com',
        password: '123456',
      };
      const expected = { accessToken: 'jwt-token' };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expected);
    });
  });
});
