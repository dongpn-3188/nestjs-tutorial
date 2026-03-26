import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { User } from '../../../src/database/Entities/user.entity';
import { createUser, UserSeed } from '../factories/user.factory';

export type SeededLoginUser = User & {
  plainPassword: string;
  accessToken: string;
};

export async function seedUserAndLogin(
  app: INestApplication,
  dataSource: DataSource,
  override: UserSeed = {},
): Promise<SeededLoginUser> {
  const user = await createUser(dataSource, override);
  const loginRes = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: user.email, password: user.plainPassword })
    .expect(201);

  return {
    ...user,
    accessToken: loginRes.body.accessToken,
  };
}

export async function seedUsersAndLogin(
  app: INestApplication,
  dataSource: DataSource,
  overrides: UserSeed[],
): Promise<SeededLoginUser[]> {
  const seeded: SeededLoginUser[] = [];
  for (const override of overrides) {
    seeded.push(await seedUserAndLogin(app, dataSource, override));
  }
  return seeded;
}
