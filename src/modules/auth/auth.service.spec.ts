import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  const mockAuthRepository = {
    existsByEmail: jest.fn(),
    createUser: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: mockAuthRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should throw UnauthorizedException when email already exists', async () => {
      mockAuthRepository.existsByEmail.mockResolvedValue(true);

      await expect(
        service.register({
          username: 'john',
          email: 'john@example.com',
          password: '123456',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should create user and return access token', async () => {
      mockAuthRepository.existsByEmail.mockResolvedValue(false);
      mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
      mockAuthRepository.createUser.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
      });
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.register({
        username: 'john',
        email: 'john@example.com',
        password: '123456',
      });

      expect(mockAuthRepository.existsByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith(
        {
          username: 'john',
          email: 'john@example.com',
          password: '123456',
        },
        'hashed-password',
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: 1, email: 'john@example.com' },
        { expiresIn: '1h' },
      );
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException when user is not found', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'john@example.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
        password: 'hashed-password',
      });
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login({ email: 'john@example.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should return access token when credentials are valid', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
        password: 'hashed-password',
      });
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login({
        email: 'john@example.com',
        password: '123456',
      });

      expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: 1, email: 'john@example.com' },
        { expiresIn: '1h' },
      );
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });
  });
});
