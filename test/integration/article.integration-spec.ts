import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { join } from 'path';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Article } from '../../src/database/Entities/article.entity';
import { createArticle, createArticles } from './factories/article.factory';
import { createTags } from './factories/tag.factory';
import { closeIntegrationApp, createIntegrationApp } from './setup/create-integration-app';
import { seedUsersAndLogin } from './setup/seed-login.helper';
import { cleanDatabase } from './setup/db-cleaner';

dotenv.config({ path: join(process.cwd(), '.env.test'), override: true });

describe('Articles (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let otherToken: string;
  let authorUser: any;
  let otherUser: any;
  let nestjsTag: any;
  let reactTag: any;
  let typescriptTag: any;
  let forUpdateArticle: Article;
  let forDeleteArticle: Article;

  beforeAll(async () => {
    ({ app, dataSource } = await createIntegrationApp());
    await cleanDatabase(dataSource);
    const [user, other] = await seedUsersAndLogin(app, dataSource, [
      {
        username: 'author',
        email: 'author@test.com',
      },
      {
        username: 'other',
        email: 'other@test.com',
      },
    ]);
    accessToken = user.accessToken;
    otherToken = other.accessToken;
    authorUser = user;
    otherUser = other;
    
    [nestjsTag, reactTag, typescriptTag] = await createTags(dataSource, ['nestjs', 'react', 'typescript']);

    await createArticles(dataSource, app, user, 9, { title: 'Test Article User', tags: [nestjsTag] });
    await createArticles(dataSource, app, other, 9, { title: 'Test Article Other', tags: [reactTag] });

    forDeleteArticle = await createArticle(dataSource, app, authorUser, {
      title: 'Delete Article',
      description: 'Desc',
      body: 'Body content',
      tags: [nestjsTag],
    });

    forUpdateArticle = await createArticle(dataSource, app, authorUser, {
      title: 'Slug Article',
      description: 'Desc',
      body: 'Body content',
      tags: [typescriptTag],
    });
  });

  afterAll(async () => {
    await closeIntegrationApp();
  });

  describe('GET /api/articles', () => {
    it('returns paginated list with correct metadata when 20 articles exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/articles')
        .query({ itemCount: 10, page: 0 })
        .expect(200);
      expect(res.body.page).toEqual({
        itemCount: 10,
        pageNumber: 1,
        totalItems: 20,
      });
      expect(res.body.articles).toHaveLength(10);
    });

    it('returns second page of results', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/articles')
        .query({ itemCount: 10, page: 1 })
        .expect(200);
      expect(res.body.page).toEqual({
        itemCount: 10,
        pageNumber: 2,
        totalItems: 20,
      });
      expect(res.body.articles).toHaveLength(10);
    });

    it('filters articles by tag and returns only matching articles', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/articles')
        .query({ tag: 'nestjs' })
        .expect(200);
      expect(res.body.page.totalItems).toBe(10);
      res.body.articles.forEach((a) => {
        expect(a.tagList).toContain('nestjs');
      });
    });

    it('filters articles by author username', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/articles')
        .query({ author: 'author' })
        .expect(200);
      expect(res.body.page.totalItems).toBe(11);
      res.body.articles.forEach((a) => {
        expect(a.author.username).toBe('author');
      });
    });

    it('returns correct article shape for each item', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/articles')
        .expect(200);
      const article = res.body.articles[0];
      expect(article).toMatchObject({
        title: 'Slug Article',
        description: 'Desc',
        body: 'Body content',
        tagList: ['typescript'],
        favorited: false,
        favoritesCount: 0,
        author: { username: 'author' },
      });
      expect(article.slug).toBeDefined();
      expect(article.createdAt).toBeDefined();
      expect(article.updatedAt).toBeDefined();
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('returns correct article data by slug', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/articles/${forUpdateArticle.slug}`)
        .expect(200);

      expect(res.body.article).toMatchObject({
        slug: forUpdateArticle.slug,
        title: 'Slug Article',
        description: 'Desc',
        body: 'Body content',
        tagList: ['typescript'],
        favorited: false,
        favoritesCount: 0,
        author: { username: 'author' },
      });
    });

    it('returns 404 for non-existent slug', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/non-existent-slug')
        .expect(404);
    });
  });

  describe('POST /api/articles', () => {
    it('creates an article and returns it with correct data', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Created Article',
          description: 'Created desc',
          body: 'Created body',
          tagList: ['nestjs'],
        })
        .expect(201);

      expect(res.body.article).toMatchObject({
        title: 'Created Article',
        description: 'Created desc',
        body: 'Created body',
        tagList: ['nestjs'],
        favorited: false,
        favoritesCount: 0,
        author: { username: 'author' },
      });
      expect(res.body.article.slug).toMatch(/created-article/);

      // Verify record exists in DB
      const repo = dataSource.getRepository(Article);
      const saved = await repo.findOne({
        where: { slug: res.body.article.slug },
        relations: { author: true, tags: true },
      });
      expect(saved).not.toBeNull();
      expect(saved!.title).toBe('Created Article');
      expect(saved!.tags.map((t) => t.name)).toContain('nestjs');
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '' })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(res.body.errors).toBe('Bad Request');
      expect(res.body.message).toBeDefined();
    });

    it('returns 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/articles')
        .send({ title: 'No auth', description: 'desc', body: 'body' })
        .expect(401);
    });
  });

  describe('PUT /api/articles/:slug', () => {    
    it('returns 403 when another user tries to update', async () => {
      await request(app.getHttpServer())
        .put(`/api/articles/${forUpdateArticle.slug}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hijacked' })
        .expect(403);

      // Verify DB was NOT updated
      const repo = dataSource.getRepository(Article);
      const unchanged = await repo.findOneBy({ id: forUpdateArticle.id });
      expect(unchanged!.title).toBe('Slug Article');
    });

    it('updates article and verifies DB reflects new values', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/articles/${forUpdateArticle.slug}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title', description: 'Updated desc' })
        .expect(200);

      expect(res.body.article.title).toBe('Updated Title');
      expect(res.body.article.description).toBe('Updated desc');
      expect(res.body.article.body).toBe('Body content');
      expect(res.body.article.slug).toMatch(/updated-title/);

      // Verify DB was updated
      const repo = dataSource.getRepository(Article);
      const updated = await repo.findOneBy({ id: forUpdateArticle.id });
      expect(updated!.title).toBe('Updated Title');
      expect(updated!.description).toBe('Updated desc');
    });

    it('returns 404 for non-existent slug', async () => {
      await request(app.getHttpServer())
        .put('/api/articles/non-existent-slug')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'X' })
        .expect(404);
    });
  });

  describe('POST /api/articles/:slug/favorite', () => {
    it('favorites an article and increments favoritesCount', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/articles/${forDeleteArticle.slug}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(res.body.article.favorited).toBe(true);
      expect(res.body.article.favoritesCount).toBe(1);
    });
  });

  describe('DELETE /api/articles/:slug/favorite', () => {
    it('unfavorites an article and decrements favoritesCount', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/articles/${forDeleteArticle.slug}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.article.favorited).toBe(false);
      expect(res.body.article.favoritesCount).toBe(0);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    it('returns 403 when another user tries to delete', async () => {
      await request(app.getHttpServer())
        .delete(`/api/articles/${forDeleteArticle.slug}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      // Verify NOT deleted from DB
      const repo = dataSource.getRepository(Article);
      const stillExists = await repo.findOneBy({ id: forDeleteArticle.id });
      expect(stillExists).not.toBeNull();
    });

    it('soft-deletes article and verifies it no longer appears in DB queries', async () => {
      await request(app.getHttpServer())
        .delete(`/api/articles/${forDeleteArticle.slug}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify soft-deleted (not visible in normal query)
      const repo = dataSource.getRepository(Article);
      const deleted = await repo.findOneBy({ id: forDeleteArticle.id });
      expect(deleted).toBeNull();

      // Verify soft-delete flag is set
      const withDeleted = await repo.findOne({
        where: { id: forDeleteArticle.id },
        withDeleted: true,
      });
      expect(withDeleted!.deletedAt).not.toBeNull();
    });
  });
});
