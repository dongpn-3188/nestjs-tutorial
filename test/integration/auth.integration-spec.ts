import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { join } from 'path';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { User } from '../../src/database/Entities/user.entity';
import { closeIntegrationApp, createIntegrationApp } from './setup/create-integration-app';
import { cleanDatabase } from './setup/db-cleaner';

dotenv.config({ path: join(process.cwd(), '.env.test'), override: true });

describe('Auth (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await createIntegrationApp());
  });

  afterAll(async () => {
    await closeIntegrationApp();
  });

  describe('POST /api/auth/register', () => {
    it('creates user, hashes password, and returns access token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'john',
          email: 'john@test.com',
          password: '123456',
        })
        .expect(201);

      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.accessToken.length).toBeGreaterThan(10);

      const userRepo = dataSource.getRepository(User);
      const saved = await userRepo.findOneBy({ email: 'john@test.com' });
      expect(saved).not.toBeNull();
      expect(saved!.username).toBe('john');
      expect(saved!.password).not.toBe('123456');
      expect(await bcrypt.compare('123456', saved!.password)).toBe(true);
    });

    it('returns 400 when email already exists', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'john-2',
          email: 'john@test.com',
          password: '123456',
        })
        .expect(400);
    });

    it('returns 400 when payload is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: '', email: 'invalid-email', password: '1' })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns access token for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'john@test.com', password: '123456' })
        .expect(201);

      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.accessToken.length).toBeGreaterThan(10);
    });

    it('returns 400 for invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'john@test.com', password: 'wrong-pass' })
        .expect(400);
    });
  });
});
