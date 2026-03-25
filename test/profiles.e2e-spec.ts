import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ProfilesController } from '../src/modules/users/profiles.controller';
import { UsersService } from '../src/modules/users/users.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../src/modules/auth/guards/optional-jwt-auth.guard';
import { createE2eApp } from './helpers/create-e2e-app';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { MockOptionalJwtAuthGuard } from './helpers/mock-optional-jwt-auth.guard';

describe('ProfilesController', () => {
  let app: INestApplication<App>;

  const mockUsersService = {
    findProfileById: jest.fn().mockResolvedValue({ profile: {} }),
    follow: jest.fn().mockResolvedValue({ profile: {} }),
    unfollow: jest.fn().mockResolvedValue({ profile: {} }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(OptionalJwtAuthGuard)
      .useClass(MockOptionalJwtAuthGuard)
      .compile();

    app = createE2eApp(moduleFixture);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/profiles/:id', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer()).get('/api/profiles/1').expect(200);
    });

    it('returns 400 for invalid id', async () => {
      await request(app.getHttpServer())
        .get('/api/profiles/invalid')
        .expect(400);
    });
  });

  describe('POST /api/profiles/:id/follow', () => {
    it('returns 201', async () => {
      await request(app.getHttpServer())
        .post('/api/profiles/1/follow')
        .expect(201);
    });
  });

  describe('DELETE /api/profiles/:id/follow', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer())
        .delete('/api/profiles/1/follow')
        .expect(200);
    });
  });
});