import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { SharedService } from '../../common/shared.service';

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

  const mockSharedService = {
    getSharedMessage: jest.fn(),
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
        {
          provide: SharedService,
          useValue: mockSharedService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should throw BadRequestException when email already exists', async () => {
      mockAuthRepository.existsByEmail.mockResolvedValue(true);
      mockSharedService.getSharedMessage.mockReturnValue('Email already exists');

      await expect(
        service.register({
          username: 'john',
          email: 'john@example.com',
          password: '123456',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith(
        'message.EMAIL_ALREADY_EXISTS',
      );
      expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when create user fails', async () => {
      mockAuthRepository.existsByEmail.mockResolvedValue(false);
      mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
      mockAuthRepository.createUser.mockRejectedValue(new Error('db error'));
      mockSharedService.getSharedMessage.mockReturnValue('Registration failed');

      await expect(
        service.register({
          username: 'john',
          email: 'john@example.com',
          password: '123456',
        }),
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith(
        'message.REGISTRATION_FAILED',
      );
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
    it('should throw BadRequestException when user is not found', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockSharedService.getSharedMessage.mockReturnValue(
        'Invalid email or password',
      );

      await expect(
        service.login({ email: 'john@example.com', password: '123456' }),
      ).rejects.toThrow(BadRequestException);

      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith(
        'message.INVALID_EMAIL_OR_PASSWORD',
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when password is invalid', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
        password: 'hashed-password',
      });
      mockBcrypt.compare.mockResolvedValue(false as never);
      mockSharedService.getSharedMessage.mockReturnValue(
        'Invalid email or password',
      );

      await expect(
        service.login({ email: 'john@example.com', password: 'wrong-password' }),
      ).rejects.toThrow(BadRequestException);

      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith(
        'message.INVALID_EMAIL_OR_PASSWORD',
      );
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
