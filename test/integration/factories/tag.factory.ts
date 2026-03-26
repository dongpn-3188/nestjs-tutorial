import { DataSource } from 'typeorm';
import { Tag } from '../../../src/database/Entities/tag.entity';

export async function createTag(
  dataSource: DataSource,
  name: string,
): Promise<Tag> {
  const repo = dataSource.getRepository(Tag);
  const existing = await repo.findOneBy({ name });
  if (existing) return existing;
  return repo.save(repo.create({ name }));
}

export async function createTags(
  dataSource: DataSource,
  names: string[],
): Promise<Tag[]> {
  return Promise.all(names.map((name) => createTag(dataSource, name)));
}
