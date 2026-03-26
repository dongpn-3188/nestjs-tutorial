import {
  HttpStatus,
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../../common/constants';
import { Comment } from '../../database/Entities/comment.entity';
import { CommentRepository } from './comment.repository';
import { SharedService } from '../../common/shared.service';
import { UsersService } from '../users/users.service';
import { ArticleService } from '../article/article.service';
import { CommentSerializer } from './serializers/comment.serializer';
import { CommentItemSerializer } from './serializers/comment-item.serializer';
import { CreateCommentDto } from './dto/create-comment.dto';

const MAX_COMMENT_PAGE_LIMIT = 20;

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly sharedService: SharedService,
    private readonly usersService: UsersService,
    private readonly articleService: ArticleService,
  ) {}

  async findAllByArticleSlug(
    slug: string,
    itemCount: number = DEFAULT_LIMIT,
    page: number = DEFAULT_OFFSET,
  ) {
    const article = await this.articleService.loadArticleBySlugOrThrow(slug);
    const { limit: normalizedItemCount, offset: normalizedPage } =
      this.sharedService.normalizedLimitAndOffset(
        itemCount,
        page,
        MAX_COMMENT_PAGE_LIMIT,
      );
    const [comments, totalCount] = await this.commentRepository.findByArticleId(
      article.id,
      normalizedItemCount,
      normalizedPage * normalizedItemCount, // convert page number to offset
    );

    return new CommentSerializer(
      {
        comments,
        offset: normalizedPage,
        limit: normalizedItemCount,
        totalCount,
      },
      { type: 'LIST', commentType: 'DEFAULT' },
    ).serialize();
  }

  async getCommentByIdOrThrow(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new NotFoundException(
        this.sharedService.getSharedMessage('message.COMMENT_NOT_FOUND'),
      );
    }
    return comment;
  }

  async create(
    slug: string,
    requesterId: number,
    createCommentDto: CreateCommentDto,
  ) {
    const article = await this.articleService.loadArticleBySlugOrThrow(slug);
    const user = await this.usersService.loadUserOrThrow(requesterId);

    try {
      const comment = await this.commentRepository.create({
        body: createCommentDto.body,
        article,
        author: user,
      });

      return {
        comment: new CommentItemSerializer(comment, {
          type: 'DEFAULT',
        }).serialize(),
      };
    } catch {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage(
          'message.COMMENT_CREATE_FAILED',
        ),
      });
    }
  }

  private validatePermission(comment: Comment, requesterId: number): void {
    if (comment.author.id !== requesterId) {
      throw new ForbiddenException(
        this.sharedService.getSharedMessage('message.COMMENT_FORBIDDEN'),
      );
    }
  }

  private validateCommentBelongsToArticle(
    comment: Comment,
    articleId: number,
  ): void {
    if (comment.article?.id !== articleId) {
      throw new NotFoundException(
        this.sharedService.getSharedMessage('message.COMMENT_NOT_BELONG_TO_ARTICLE'),
      );
    }
  }

  async remove(slug: string, commentId: number, requesterId: number) {
    const article = await this.articleService.loadArticleBySlugOrThrow(slug);
    const comment = await this.getCommentByIdOrThrow(commentId);
    this.validateCommentBelongsToArticle(comment, article.id);
    this.validatePermission(comment, requesterId);

    try {
      await this.commentRepository.delete(commentId);
      return {};
    } catch {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage(
          'message.COMMENT_DELETE_FAILED',
        ),
      });
    }
  }
}
