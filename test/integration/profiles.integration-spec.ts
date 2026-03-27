import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { join } from 'path';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { closeIntegrationApp, createIntegrationApp } from './setup/create-integration-app';
import { cleanDatabase } from './setup/db-cleaner';
import { seedUsersAndLogin } from './setup/seed-login.helper';

dotenv.config({ path: join(process.cwd(), '.env.test'), override: true });

describe('Profiles (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let currentToken: string;
  let targetUserId: number;
  let currentUserId: number;

  beforeAll(async () => {
    ({ app, dataSource } = await createIntegrationApp());
    await cleanDatabase(dataSource);

    const [current, target] = await seedUsersAndLogin(app, dataSource, [
      {
        username: 'current',
        email: 'current@test.com',
      },
      {
        username: 'target',
        email: 'target@test.com',
      },
    ]);
    currentUserId = current.id;
    targetUserId = target.id;
    currentToken = current.accessToken;    
  });

  afterAll(async () => {
    await closeIntegrationApp();
  });

  describe('GET /api/profiles/:id', () => {
    it('returns profile with following=false for anonymous request', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/profiles/${targetUserId}`)
        .expect(200);

      expect(res.body).toEqual({
        id: targetUserId,
        username: 'target',
        avatar: null,
        bio: null,
        following: false,
      });
    });
  });

  describe('POST /api/profiles/:id/follow', () => {
    it('creates follow relation and returns following=true', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/profiles/${targetUserId}/follow`)
        .set('Authorization', `Bearer ${currentToken}`)
        .expect(201);

      expect(res.body).toMatchObject({
        id: targetUserId,
        username: 'target',
        following: true,
      });

      const relation = await dataSource.query(
        'SELECT * FROM user_follow_links WHERE follower_id = ? AND following_id = ?',
        [currentUserId, targetUserId],
      );
      expect(relation).toHaveLength(1);
    });

    it('returns 400 when trying to follow self', async () => {
      await request(app.getHttpServer())
        .post(`/api/profiles/${currentUserId}/follow`)
        .set('Authorization', `Bearer ${currentToken}`)
        .expect(400);
    });
  });

  describe('DELETE /api/profiles/:id/follow', () => {
    it('removes follow relation and returns following=false', async () => {
      await request(app.getHttpServer())
        .post(`/api/profiles/${targetUserId}/follow`)
        .set('Authorization', `Bearer ${currentToken}`)
        .expect(201);

      const res = await request(app.getHttpServer())
        .delete(`/api/profiles/${targetUserId}/follow`)
        .set('Authorization', `Bearer ${currentToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: targetUserId,
        username: 'target',
        following: false,
      });

      const relation = await dataSource.query(
        'SELECT * FROM user_follow_links WHERE follower_id = ? AND following_id = ?',
        [currentUserId, targetUserId],
      );
      expect(relation).toHaveLength(0);
    });
  });
});
