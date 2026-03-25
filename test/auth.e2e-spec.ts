import {
  INestApplication,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { createE2eApp } from './helpers/create-e2e-app';

describe('AuthController', () => {
  let app: INestApplication<App>;

  const mockAuthService = {
    register: jest.fn().mockResolvedValue({ user: {} }),
    login: jest.fn().mockResolvedValue({ accessToken: 'token' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    app = createE2eApp(moduleFixture);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('returns 201', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'john_doe',
          email: 'john@example.com',
          password: '123456',
        })
        .expect(201);
    });

    it('returns 400 for invalid payload', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'ab',
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);
    });

    it('returns 500 for register failure', async () => {
      mockAuthService.register.mockRejectedValueOnce(
        new InternalServerErrorException('Registration failed'),
      );

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'john_doe',
          email: 'john@example.com',
          password: '123456',
        })
        .expect(500);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 201', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: '123456',
        })
        .expect(201);
    });

    it('returns 400 for invalid payload', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: '',
        })
        .expect(400);
    });

    it('returns 401 for invalid credentials', async () => {
      mockAuthService.login.mockRejectedValueOnce(
        new UnauthorizedException('Invalid email or password'),
      );

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrong-password',
        })
        .expect(401);
    });
  });
});