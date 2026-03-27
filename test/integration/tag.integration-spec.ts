import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { join } from 'path';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTag, createTags } from './factories/tag.factory';
import { closeIntegrationApp, createIntegrationApp } from './setup/create-integration-app';
import { cleanDatabase } from './setup/db-cleaner';

dotenv.config({ path: join(process.cwd(), '.env.test'), override: true });

describe('Tags (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await createIntegrationApp());
    await cleanDatabase(dataSource);
    await createTags(dataSource, ['angular', 'nest-js', 'nestjs', 'node', 'react', 'vue']);
  });

  afterAll(async () => {
    await closeIntegrationApp();
  });

  describe('GET /api/tags', () => {
    it('returns tags sorted by name with pagination metadata', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tags')
        .query({ itemCount: 10, page: 0 })
        .expect(200);

      expect(res.body.tags).toEqual(['angular', 'nest-js', 'nestjs', 'node', 'react', 'vue']);
      expect(res.body.page).toEqual({
        itemCount: 10,
        pageNumber: 1,
        totalItems: 6,
      });
    });

    it('supports offset-based pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tags')
        .query({ itemCount: 2, page: 2 })
        .expect(200);

      expect(res.body.tags).toEqual(['react', 'vue']);
      expect(res.body.page).toEqual({
        itemCount: 2,
        pageNumber: 3,
        totalItems: 6,
      });
    });
  });

  describe('GET /api/tags/search', () => {
    it('returns tags matching keyword', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tags/search')
        .query({ q: 'nest' })
        .expect(200);

      expect(res.body.tags).toEqual(['nest-js', 'nestjs']);
      expect(res.body.page.totalItems).toBe(2);
    });

    it('returns 400 when search keyword is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/tags/search')
        .expect(400);
    });
  });
});
