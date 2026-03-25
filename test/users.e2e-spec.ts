import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { createE2eApp } from './helpers/create-e2e-app';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';

describe('UsersController', () => {
  let app: INestApplication<App>;

  const mockUsersService = {
    findOne: jest.fn().mockResolvedValue({ user: {} }),
    update: jest.fn().mockResolvedValue({ user: {} }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = createE2eApp(moduleFixture);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/users', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(200);
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer()).get('/api/users/1').expect(200);
    });

    it('returns 400 for invalid id', async () => {
      await request(app.getHttpServer()).get('/api/users/invalid').expect(400);
    });
  });

  describe('PUT /api/users', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer())
        .put('/api/users')
        .send({ username: 'updated_name' })
        .expect(200);
    });

    it('returns 400 for invalid payload', async () => {
      await request(app.getHttpServer())
        .put('/api/users')
        .send({ email: 'invalid-email' })
        .expect(400);
    });
  });
});