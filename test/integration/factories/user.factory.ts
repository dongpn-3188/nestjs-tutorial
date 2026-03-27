import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { SALT_ROUNDS } from '../../../src/common/constants';
import { User } from '../../../src/database/Entities/user.entity';

export interface UserSeed {
  username?: string;
  email?: string;
  password?: string;
  avatar?: string | null;
  bio?: string | null;
}

export async function createUser(
  dataSource: DataSource,
  override: UserSeed = {},
): Promise<User & { plainPassword: string }> {
  const repo = dataSource.getRepository(User);
  const plainPassword = override.password ?? 'Password123';
  const user = repo.create({
    username: override.username ?? `user_${Date.now()}`,
    email: override.email ?? `user_${Date.now()}@test.com`,
    password: await bcrypt.hash(plainPassword, SALT_ROUNDS),
    avatar: override.avatar ?? undefined,
    bio: override.bio ?? undefined,
  });
  const saved = await repo.save(user);
  return Object.assign(saved, { plainPassword });
}
