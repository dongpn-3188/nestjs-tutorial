import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { join } from 'path';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { User } from '../../src/database/Entities/user.entity';
import { closeIntegrationApp, createIntegrationApp } from './setup/create-integration-app';
import { cleanDatabase } from './setup/db-cleaner';
import { seedUsersAndLogin } from './setup/seed-login.helper';

dotenv.config({ path: join(process.cwd(), '.env.test'), override: true });

describe('Users (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let currentUser: User;
  let otherUser: User;

  beforeAll(async () => {
    ({ app, dataSource } = await createIntegrationApp());
    await cleanDatabase(dataSource);

    const [createdCurrentUser, createdOtherUser] = await seedUsersAndLogin(app, dataSource, [
      {
        username: 'current',
        email: 'current@test.com',
      },
      {
        username: 'other',
        email: 'other@test.com',
      },
    ]);

    currentUser = createdCurrentUser;
    otherUser = createdOtherUser;
    accessToken = createdCurrentUser.accessToken;
  });

  afterAll(async () => {
    await closeIntegrationApp();
  });

  describe('GET /api/users', () => {
    it('returns current user basic info', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toEqual({
        id: currentUser.id,
        email: 'current@test.com',
        username: 'current',
        avatar: null,
        bio: null,
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns target user basic info by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toEqual({
        id: otherUser.id,
        email: 'other@test.com',
        username: 'other',
        avatar: null,
        bio: null,
      });
    });
  });

  describe('PUT /api/users', () => {
    it('updates profile fields and stores hashed password', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'updated-user',
          email: 'updated@test.com',
          bio: 'New bio',
          password: 'new-secret',
        })
        .expect(200);

      expect(res.body).toMatchObject({
        id: currentUser.id,
        username: 'updated-user',
        email: 'updated@test.com',
        bio: 'New bio',
      });

      const userRepo = dataSource.getRepository(User);
      const saved = await userRepo.findOneBy({ id: currentUser.id });
      expect(saved!.username).toBe('updated-user');
      expect(saved!.email).toBe('updated@test.com');
      expect(saved!.bio).toBe('New bio');
      expect(saved!.password).not.toBe('new-secret');
      expect(await bcrypt.compare('new-secret', saved!.password)).toBe(true);
    });

    it('returns 400 when updating to existing email', async () => {
      await request(app.getHttpServer())
        .put('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'other@test.com' })
        .expect(400);
    });
  });
});
