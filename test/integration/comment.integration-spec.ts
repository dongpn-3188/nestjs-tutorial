import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { join } from 'path';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Article } from '../../src/database/Entities/article.entity';
import { Comment } from '../../src/database/Entities/comment.entity';
import { createArticle } from './factories/article.factory';
import { closeIntegrationApp, createIntegrationApp } from './setup/create-integration-app';
import { cleanDatabase } from './setup/db-cleaner';
import { seedUsersAndLogin } from './setup/seed-login.helper';
import { createComment, createComments } from './factories/comment.factory';

dotenv.config({ path: join(process.cwd(), '.env.test'), override: true });

describe('Comments (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authorToken: string;
  let otherToken: string;
  let article: Article;
  let forDelete: Comment;

  beforeAll(async () => {
    ({ app, dataSource } = await createIntegrationApp());
    await cleanDatabase(dataSource);

    const [author, other] = await seedUsersAndLogin(app, dataSource, [
      {
        username: 'author',
        email: 'author@test.com',
      },
      {
        username: 'other',
        email: 'other@test.com',
      },
    ]);
    authorToken = author.accessToken;
    otherToken = other.accessToken;

    article = await createArticle(dataSource, app, author, {
      title: 'Comment Article',
      description: 'Desc',
      body: 'Body',
    });

    await createComments(dataSource, article, author, 2);
    forDelete = await createComment(dataSource, {
      body: 'To be deleted',
      article,    
      author: author,
    });
  });

  afterAll(async () => {
    await closeIntegrationApp();
  });

  describe('GET /api/articles/:slug/comments', () => {
    it('returns comment list with correct shape and metadata', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/articles/${article.slug}/comments`)
        .query({ itemCount: 10, page: 0 })
        .expect(200);

      expect(res.body.comments).toHaveLength(3);
      expect(res.body.comments[0]).toMatchObject({
        body: 'Test comment 1',
        author: { id : 1, username: 'author' },
      });
      expect(res.body.page).toEqual({ itemCount: 10, pageNumber: 1, totalItems: 3 });
    });
  });

  describe('POST /api/articles/:slug/comments', () => {
    it('creates comment and persists it in database', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ body: 'Created comment' })
        .expect(201);

      expect(res.body.comment).toMatchObject({
        body: 'Created comment',
        author: { username: 'author' },
      });

      const commentRepo = dataSource.getRepository(Comment);
      const saved = await commentRepo.findOne({
        where: { id: res.body.comment.id },
        relations: { article: true, author: true },
      });

      expect(saved).not.toBeNull();
      expect(saved!.body).toBe('Created comment');
      expect(saved!.article.id).toBe(article.id);
      expect(saved!.author.username).toBe('author');
    });

    it('returns 401 when unauthenticated', async () => {
      await request(app.getHttpServer())
        .post(`/api/articles/${article.slug}/comments`)
        .send({ body: 'No auth' })
        .expect(401);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id', () => {
    it('returns 403 when non-owner tries deleting', async () => {
      const commentRepo = dataSource.getRepository(Comment);
      await request(app.getHttpServer())
        .delete(`/api/articles/${article.slug}/comments/${forDelete.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      const stillExists = await commentRepo.findOneBy({ id: forDelete.id });
      expect(stillExists).not.toBeNull();
    });

    it('deletes comment for owner and removes DB record', async () => {
      const commentRepo = dataSource.getRepository(Comment);
      await request(app.getHttpServer())
        .delete(`/api/articles/${article.slug}/comments/${forDelete.id}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(200);

      const deleted = await commentRepo.findOneBy({ id: forDelete.id });
      expect(deleted).toBeNull();
    });
  });
});
