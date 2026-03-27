import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SharedService } from '../../../src/common/shared.service';
import { Article } from '../../../src/database/Entities/article.entity';
import { Tag } from '../../../src/database/Entities/tag.entity';
import { User } from '../../../src/database/Entities/user.entity';

export interface ArticleSeed {
  title?: string;
  description?: string;
  body?: string;
  tags?: Tag[];
}

export async function createArticle(
  dataSource: DataSource,
  app: INestApplication,
  author: User,
  override: ArticleSeed = {},
): Promise<Article> {
  const repo = dataSource.getRepository(Article);
  const sharedService = app.get(SharedService);

  const article = repo.create({
    title: override.title ?? `Article ${Date.now()}`,
    description: override.description ?? 'A test description',
    body: override.body ?? 'A test body',
    author,
    tags: override.tags ?? [],
  });
  const saved = await repo.save(article);
  saved.slug = sharedService.buildSlug(saved.id, saved.title);
  return repo.save(saved);
}

export async function createArticles(
  dataSource: DataSource,
  app: INestApplication,
  author: User,
  count: number,
  override: ArticleSeed = {},
): Promise<Article[]> {
  const results: Article[] = [];
  for (let i = 0; i < count; i++) {
    results.push(
      await createArticle(dataSource, app, author, {
        ...override,
        title: `${override.title ?? 'Article'} ${i + 1}`,
      }),
    );
  }
  return results;
}
