import {
  INestApplication,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ArticleController } from '../src/modules/article/article.controller';
import { ArticleService } from '../src/modules/article/article.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../src/modules/auth/guards/optional-jwt-auth.guard';
import { createE2eApp } from './helpers/create-e2e-app';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { MockOptionalJwtAuthGuard } from './helpers/mock-optional-jwt-auth.guard';

describe('ArticleController', () => {
  let app: INestApplication<App>;

  const mockArticleService = {
    findAll: jest.fn().mockResolvedValue({ articles: [], page: {} }),
    findFeed: jest.fn().mockResolvedValue({ articles: [], page: {} }),
    findOne: jest.fn().mockResolvedValue({ article: {} }),
    create: jest.fn().mockResolvedValue({ article: {} }),
    update: jest.fn().mockResolvedValue({ article: {} }),
    remove: jest.fn().mockResolvedValue({}),
    favorite: jest.fn().mockResolvedValue({ article: {} }),
    unfavorite: jest.fn().mockResolvedValue({ article: {} }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        {
          provide: ArticleService,
          useValue: mockArticleService,
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

  describe('GET /api/articles', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer()).get('/api/articles').expect(200);
    });

    it('returns 400 for invalid query', async () => {
      await request(app.getHttpServer())
        .get('/api/articles')
        .query({ itemCount: '-1' })
        .expect(400);
    });
  });

  describe('GET /api/articles/feed', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer()).get('/api/articles/feed').expect(200);
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/test-article')
        .expect(200);
    });

    it('returns 404 for missing article', async () => {
      mockArticleService.findOne.mockRejectedValueOnce(
        new NotFoundException('Article not found'),
      );

      await request(app.getHttpServer())
        .get('/api/articles/missing-article')
        .expect(404);
    });
  });

  describe('POST /api/articles', () => {
    it('returns 201', async () => {
      await request(app.getHttpServer())
        .post('/api/articles')
        .send({
          title: 'Test article',
          description: 'Test description',
          body: 'Test body',
          tagList: ['nestjs'],
        })
        .expect(201);
    });

    it('returns 400 for invalid payload', async () => {
      await request(app.getHttpServer())
        .post('/api/articles')
        .send({
          title: '',
          description: '',
          body: '',
          tagList: 'invalid',
        })
        .expect(400);
    });

    it('returns 500 for create failure', async () => {
      mockArticleService.create.mockRejectedValueOnce(
        new InternalServerErrorException('Failed to create article'),
      );

      await request(app.getHttpServer())
        .post('/api/articles')
        .send({
          title: 'Test article',
          description: 'Test description',
          body: 'Test body',
        })
        .expect(500);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer())
        .put('/api/articles/test-article')
        .send({ title: 'Updated title' })
        .expect(200);
    });

    it('returns 400 for invalid payload', async () => {
      await request(app.getHttpServer())
        .put('/api/articles/test-article')
        .send({ tagList: 'invalid' })
        .expect(400);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer())
        .delete('/api/articles/test-article')
        .expect(200);
    });
  });

  describe('POST /api/articles/:slug/favorite', () => {
    it('returns 201', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/test-article/favorite')
        .expect(201);
    });
  });

  describe('DELETE /api/articles/:slug/favorite', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer())
        .delete('/api/articles/test-article/favorite')
        .expect(200);
    });
  });
});