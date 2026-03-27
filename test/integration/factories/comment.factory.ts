import { DataSource } from 'typeorm';
import { Comment } from '../../../src/database/Entities/comment.entity';
import { Article } from '../../../src/database/Entities/article.entity';
import { User } from '../../../src/database/Entities/user.entity';

export interface CommentSeed {
  body?: string;
  article: Article;
  author: User;
}

export async function createComment(
  dataSource: DataSource,
  seed: CommentSeed,
): Promise<Comment> {
  const repo = dataSource.getRepository(Comment);
  const comment = repo.create({
    body: seed.body ?? 'A test comment',
    article: seed.article,
    author: seed.author,
  });
  return repo.save(comment);
}

export async function createComments(
  dataSource: DataSource,
  article: Article,
  author: User,
  count: number,
): Promise<Comment[]> {
  const comments: Comment[] = [];
  for (let i = 0; i < count; i++) {
    comments.push(
      await createComment(dataSource, {
        article,
        author,
        body: `Test comment ${i + 1}`,
      })
    );
  }
  return comments;
}
