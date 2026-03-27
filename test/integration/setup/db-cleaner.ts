import { DataSource } from 'typeorm';

// Tables ordered to respect foreign key constraints
const TRUNCATE_ORDER = [
  'article_tag_links',
  'article_favorite_links',
  'user_follow_links',
  'comment',
  'article',
  'tag',
  'user',
];

export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of TRUNCATE_ORDER) {
    await dataSource.query(`TRUNCATE TABLE \`${table}\``);
  }
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}
