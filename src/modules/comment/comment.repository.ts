import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../database/Entities/comment.entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async create(comment: Partial<Comment>): Promise<Comment> {
    const newComment = this.commentRepository.create(comment);
    return this.commentRepository.save(newComment);
  }

  async findById(id: number): Promise<Comment | null> {
    return this.commentRepository.findOne({
      where: { id },
      relations: ['author', 'article'],
    });
  }

  async findByArticleId(
    articleId: number,
    limit: number,
    offset: number,
  ): Promise<[Comment[], number]> {
    return this.commentRepository.findAndCount({
      where: { article: { id: articleId } },
      relations: ['author'],
      order: { id: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async delete(id: number): Promise<void> {
    await this.commentRepository.delete(id);
  }
}
