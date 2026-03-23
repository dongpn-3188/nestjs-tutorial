import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Article } from '../../database/Entities/article.entity';
import { Tag } from '../../database/Entities/tag.entity';
import { SharedService } from '../../common/shared.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { GetArticleDto } from './dto/get-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticleRepository {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly sharedService: SharedService,
  ) {}

  async findAll(query: GetArticleDto): Promise<[Article[], number]> {
    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.tags', 'tags')
      .leftJoinAndSelect('article.favoritedBy', 'favoritedBy')
      .where('article.deleted_at IS NULL')
      .orderBy('article.id', 'DESC')
      .take(query.itemCount)
      .skip(query.page)
      .andWhere('(:tag IS NULL OR tags.name = :tag)', {
        tag: query.tag ?? null,
      })
      .andWhere('(:author IS NULL OR author.username = :author)', {
        author: query.author ?? null,
      })
      .andWhere(
        '(:favorited IS NULL OR EXISTS (SELECT 1 FROM article_favorite_links afl INNER JOIN user user_favorited ON user_favorited.id = afl.user_id WHERE afl.article_id = article.id AND user_favorited.username = :favorited))',
        { favorited: query.favorited ?? null },
      )
      .distinct(true);
    return queryBuilder.getManyAndCount();
  }

  async findFeedByUserId(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<[Article[], number]> {
    return this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.tags', 'tags')
      .leftJoinAndSelect('article.favoritedBy', 'favoritedBy')
      .where('article.deleted_at IS NULL')
      .andWhere(
        'author.id IN (SELECT ufl.following_id FROM user_follow_links ufl WHERE ufl.follower_id = :userId)',
        { userId },
      )
      .orderBy('article.id', 'DESC')
      .take(limit)
      .skip(offset)
      .distinct(true)
      .getManyAndCount();
  }

  findBySlug(slug: string): Promise<Article | null> {
    return this.articleRepository.findOne({
      where: { slug, deletedAt: IsNull() },
      relations: {
        author: true,
        tags: true,
        favoritedBy: true,
      },
    });
  }

  async createArticle(
    authorId: number,
    data: CreateArticleDto,
    tags: Tag[],
  ): Promise<Article> {
    const article = this.articleRepository.create({
      title: data.title,
      description: data.description,
      body: data.body,
      author: { id: authorId } as Article['author'],
      tags,
    });
    const createdArticle = await this.articleRepository.save(article);
    createdArticle.slug = this.sharedService.buildSlug(
      createdArticle.id,
      createdArticle.title,
    );
    return this.articleRepository.save(createdArticle);
  }

  async updateArticle(
    article: Article,
    updateData: UpdateArticleDto,
    tags?: Tag[],
  ): Promise<Article> {
    if (tags) {
      article.tags = tags;
    }

    if (updateData.title && updateData.title !== article.title) {
      article.slug = this.sharedService.buildSlug(article.id, updateData.title);
    }

    Object.assign(article, {
      title: updateData.title ?? article.title,
      description: updateData.description ?? article.description,
      body: updateData.body ?? article.body,
    });
    return this.articleRepository.save(article);
  }

  async softDelete(articleId: number): Promise<void> {
    await this.articleRepository.softDelete(articleId);
  }

  isArticleFavoritedByUser(
    articleId: number,
    userId: number,
  ): Promise<boolean> {
    return this.articleRepository
      .createQueryBuilder('article')
      .innerJoin(
        'article.favoritedBy',
        'favoritedBy',
        'favoritedBy.id = :userId',
        {
          userId,
        },
      )
      .where('article.id = :articleId', { articleId })
      .andWhere('article.deleted_at IS NULL')
      .getExists();
  }

  async favorite(article: Article, userId: number): Promise<Article> {
    article.favoritedBy = [
      ...(article.favoritedBy || []),
      { id: userId } as Article['favoritedBy'][number],
    ];
    return this.articleRepository.save(article);
  }

  async unfavorite(article: Article, userId: number): Promise<Article> {
    article.favoritedBy = (article.favoritedBy || []).filter(
      (user) => user.id !== userId,
    );
    return this.articleRepository.save(article);
  }
}
