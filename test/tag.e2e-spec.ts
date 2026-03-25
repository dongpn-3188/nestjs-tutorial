import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { TagController } from '../src/modules/tag/tag.controller';
import { TagService } from '../src/modules/tag/tag.service';
import { createE2eApp } from './helpers/create-e2e-app';

describe('TagController', () => {
  let app: INestApplication<App>;

  const mockTagService = {
    findAll: jest.fn().mockResolvedValue({ tags: [], page: {} }),
    searchByName: jest.fn().mockResolvedValue({ tags: [], page: {} }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TagController],
      providers: [
        {
          provide: TagService,
          useValue: mockTagService,
        },
      ],
    }).compile();

    app = createE2eApp(moduleFixture);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/tags', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer()).get('/api/tags').expect(200);
    });

    it('returns 400 for invalid pagination', async () => {
      await request(app.getHttpServer())
        .get('/api/tags')
        .query({ itemCount: 'invalid' })
        .expect(400);
    });
  });

  describe('GET /api/tags/search', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer())
        .get('/api/tags/search')
        .query({ q: 'nest' })
        .expect(200);
    });

    it('returns 400 for invalid pagination', async () => {
      await request(app.getHttpServer())
        .get('/api/tags/search')
        .query({ q: 'nest', page: 'invalid' })
        .expect(400);
    });
  });
});