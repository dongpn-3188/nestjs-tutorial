import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SharedService } from '../../common/shared.service';
import { ArticleRepository } from './article.repository';
import { Article } from '../../database/Entities/article.entity';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../../common/constants';
import { CreateArticleDto } from './dto/create-article.dto';
import { GetArticleDto } from './dto/get-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Tag } from '../../database/Entities/tag.entity';
import { UsersService } from '../users/users.service';
import { TagService } from '../tag/tag.service';
import { ArticleSerializer } from './serializers/article.serializer';
import { ArticleItemSerializer } from './serializers/article-item.serializer';

const MAX_ARTICLE_PAGE_LIMIT = 20;

@Injectable()
export class ArticleService {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly sharedService: SharedService,
    private readonly usersService: UsersService,
    private readonly tagService: TagService,
  ) {}

  async loadArticleBySlugOrThrow(slug: string): Promise<Article> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundException(
        this.sharedService.getSharedMessage('message.ARTICLE_NOT_FOUND'),
      );
    }
    return article;
  }

  async checkAuthorExistsOrThrow(authorId: number): Promise<void> {
    await this.usersService.checkUserExistOrThrow(authorId);
  }

  private validatePermission(article: Article, requesterId: number): void {
    if (article.author.id !== requesterId) {
      throw new ForbiddenException(
        this.sharedService.getSharedMessage('message.ARTICLE_FORBIDDEN'),
      );
    }
  }

  async loadTagsOrThrow(tagList?: string[]): Promise<Tag[]> {
    const normalizedTagNames = [
      ...new Set((tagList || []).map((tag) => tag.trim()).filter(Boolean)),
    ];
    if (normalizedTagNames.length === 0) {
      return [];
    }
    const tags = await this.tagService.findTagsByNames(normalizedTagNames);
    if (tags.length !== normalizedTagNames.length) {
      throw new NotFoundException(
        this.sharedService.getSharedMessage('message.TAG_NOT_FOUND'),
      );
    }
    return tags;
  }

  async findAll(query: GetArticleDto, currentUserId?: number) {
    const { limit: itemCount, offset: page } =
      this.sharedService.normalizedLimitAndOffset(
        query.itemCount ?? DEFAULT_LIMIT,
        query.page ?? DEFAULT_OFFSET,
        MAX_ARTICLE_PAGE_LIMIT,
      );
    const [articles, totalCount] = await this.articleRepository.findAll({
      ...query,
      itemCount,
      page,
    });
    return new ArticleSerializer(
      {
        articles,
        offset: page,
        limit: itemCount,
        totalCount,
      },
      {
        type: 'LIST',
        itemType: 'DETAIL',
        currentUserId,
        buildSlug: this.sharedService.buildSlug.bind(this.sharedService),
      },
    ).serialize();
  }

  async findFeed(
    itemCount: number = DEFAULT_LIMIT,
    page: number = DEFAULT_OFFSET,
    currentUserId: number,
  ) {
    const { limit: normalizedItemCount, offset: normalizedPage } =
      this.sharedService.normalizedLimitAndOffset(
        itemCount,
        page,
        MAX_ARTICLE_PAGE_LIMIT,
      );
    const [articles, totalCount] =
      await this.articleRepository.findFeedByUserId(
        currentUserId,
        normalizedItemCount,
        normalizedPage,
      );
    return new ArticleSerializer(
      {
        articles,
        offset: normalizedPage,
        limit: normalizedItemCount,
        totalCount,
      },
      {
        type: 'LIST',
        itemType: 'DETAIL',
        currentUserId,
        buildSlug: this.sharedService.buildSlug.bind(this.sharedService),
      },
    ).serialize();
  }

  async findOne(slug: string, currentUserId?: number) {
    const article = await this.loadArticleBySlugOrThrow(slug);
    return {
      article: new ArticleItemSerializer(article, {
        type: 'DETAIL',
        currentUserId,
        buildSlug: this.sharedService.buildSlug.bind(this.sharedService),
      }).serialize(),
    };
  }

  async create(authorId: number, createArticleDto: CreateArticleDto) {
    await this.checkAuthorExistsOrThrow(authorId);
    const tags = await this.loadTagsOrThrow(createArticleDto.tagList);
    try {
      const article = await this.articleRepository.createArticle(
        authorId,
        createArticleDto,
        tags,
      );
      return {
        article: new ArticleItemSerializer(article, {
          type: 'DETAIL',
          currentUserId: authorId,
          buildSlug: this.sharedService.buildSlug.bind(this.sharedService),
        }).serialize(),
      };
    } catch {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage(
          'message.ARTICLE_CREATE_FAILED',
        ),
      });
    }
  }

  async update(
    slug: string,
    requesterId: number,
    updateArticleDto: UpdateArticleDto,
  ) {
    const article = await this.loadArticleBySlugOrThrow(slug);
    this.validatePermission(article, requesterId);
    const tags = updateArticleDto.tagList
      ? await this.loadTagsOrThrow(updateArticleDto.tagList)
      : undefined;
    try {
      const updatedArticle = await this.articleRepository.updateArticle(
        article,
        updateArticleDto,
        tags,
      );
      return {
        article: new ArticleItemSerializer(updatedArticle, {
          type: 'DETAIL',
          currentUserId: requesterId,
          buildSlug: this.sharedService.buildSlug.bind(this.sharedService),
        }).serialize(),
      };
    } catch {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage(
          'message.ARTICLE_UPDATE_FAILED',
        ),
      });
    }
  }

  async remove(slug: string, requesterId: number) {
    const article = await this.loadArticleBySlugOrThrow(slug);
    this.validatePermission(article, requesterId);
    try {
      await this.articleRepository.remove(article);
      return {
        message: this.sharedService.getSharedMessage(
          'message.ARTICLE_DELETE_SUCCESS',
        ),
      };
    } catch {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage(
          'message.ARTICLE_DELETE_FAILED',
        ),
      });
    }
  }

  async favorite(slug: string, requesterId: number) {
    const article = await this.loadArticleBySlugOrThrow(slug);
    try {
      const hasFavorited =
        await this.articleRepository.isArticleFavoritedByUser(
          article.id,
          requesterId,
        );
      const favoritedArticle = hasFavorited
        ? article
        : await this.articleRepository.favorite(article, requesterId);
      return {
        article: new ArticleItemSerializer(favoritedArticle, {
          type: 'DETAIL',
          currentUserId: requesterId,
          buildSlug: this.sharedService.buildSlug.bind(this.sharedService),
        }).serialize(),
      };
    } catch {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage(
          'message.ARTICLE_FAVORITE_FAILED',
        ),
      });
    }
  }

  async unfavorite(slug: string, requesterId: number) {
    const article = await this.loadArticleBySlugOrThrow(slug);
    try {
      const hasFavorited =
        await this.articleRepository.isArticleFavoritedByUser(
          article.id,
          requesterId,
        );
      const unfavoritedArticle = hasFavorited
        ? await this.articleRepository.unfavorite(article, requesterId)
        : article;
      return {
        article: new ArticleItemSerializer(unfavoritedArticle, {
          type: 'DETAIL',
          currentUserId: requesterId,
          buildSlug: this.sharedService.buildSlug.bind(this.sharedService),
        }).serialize(),
      };
    } catch {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage(
          'message.ARTICLE_UNFAVORITE_FAILED',
        ),
      });
    }
  }
}
