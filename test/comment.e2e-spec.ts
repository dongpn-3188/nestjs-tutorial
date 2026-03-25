import {
  INestApplication,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { CommentController } from '../src/modules/comment/comment.controller';
import { CommentService } from '../src/modules/comment/comment.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { createE2eApp } from './helpers/create-e2e-app';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';

describe('CommentController', () => {
  let app: INestApplication<App>;

  const mockCommentService = {
    findAllByArticleSlug: jest.fn().mockResolvedValue({ comments: [], page: {} }),
    create: jest.fn().mockResolvedValue({ comment: {} }),
    remove: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentService,
          useValue: mockCommentService,
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

  describe('GET /api/articles/:slug/comments', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/test-article/comments')
        .query({ itemCount: '20', page: '0' })
        .expect(200);
    });

    it('returns 404 for missing article', async () => {
      mockCommentService.findAllByArticleSlug.mockRejectedValueOnce(
        new NotFoundException('Article not found'),
      );

      await request(app.getHttpServer())
        .get('/api/articles/missing-article/comments')
        .expect(404);
    });
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('returns 201', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/test-article/comments')
        .send({ body: 'new comment' })
        .expect(201);
    });

    it('returns 400 for empty body', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/test-article/comments')
        .send({})
        .expect(400);
    });

    it('returns 500 for create failure', async () => {
      mockCommentService.create.mockRejectedValueOnce(
        new InternalServerErrorException({
          statusCode: 500,
          errors: 'Internal Server Error',
          message: 'Failed to create comment',
        }),
      );

      await request(app.getHttpServer())
        .post('/api/articles/test-article/comments')
        .send({ body: 'new comment' })
        .expect(500);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('returns 200', async () => {
      await request(app.getHttpServer())
        .delete('/api/articles/test-article/comments/10')
        .expect(200);
    });

    it('returns 403 for forbidden user', async () => {
      mockCommentService.remove.mockRejectedValueOnce(
        new ForbiddenException(
          'You are not allowed to perform this action on this comment',
        ),
      );

      await request(app.getHttpServer())
        .delete('/api/articles/test-article/comments/10')
        .expect(403);
    });

    it('returns 404 for wrong article', async () => {
      mockCommentService.remove.mockRejectedValueOnce(
        new NotFoundException('Comment does not belong to this article'),
      );

      await request(app.getHttpServer())
        .delete('/api/articles/test-article/comments/10')
        .expect(404);
    });

    it('returns 500 for delete failure', async () => {
      mockCommentService.remove.mockRejectedValueOnce(
        new InternalServerErrorException({
          statusCode: 500,
          errors: 'Internal Server Error',
          message: 'Failed to delete comment',
        }),
      );

      await request(app.getHttpServer())
        .delete('/api/articles/test-article/comments/10')
        .expect(500);
    });
  });
});