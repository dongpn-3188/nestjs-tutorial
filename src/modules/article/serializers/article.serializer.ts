import { Article } from '../../../database/Entities/article.entity';
import {
  ArticleItemSerializer,
  ArticleItemSerializerType,
} from './article-item.serializer';
export type ArticleSerializerType = 'LIST';
const ARTICLE_FIELDS: Record<ArticleSerializerType, string[]> = {
  LIST: ['articles', 'page'],
};
type ArticleSerializerOptions = {
  type: ArticleSerializerType;
  itemType: ArticleItemSerializerType;
  currentUserId?: number;
  buildSlug: (id: number, title: string) => string;
};
type ArticleListPayload = {
  articles: Article[];
  offset: number;
  limit: number;
  totalCount: number;
};
export class ArticleSerializer {
  constructor(
    private readonly payload: ArticleListPayload,
    private readonly options: ArticleSerializerOptions,
  ) {}
  private get allowedFields(): string[] {
    return ARTICLE_FIELDS[this.options.type] || [];
  }
  private get normalizedPayload(): Record<string, any> {
    const listPayload = this.payload as ArticleListPayload;
    return {
      articles: listPayload.articles.map((article) =>
        new ArticleItemSerializer(article, {
          type: this.options.itemType,
          currentUserId: this.options.currentUserId,
          buildSlug: this.options.buildSlug,
        }).serialize(),
      ),
      page: {
        itemCount: listPayload.limit,
        pageNumber: listPayload.offset + 1,
        totalItems: listPayload.totalCount,
      },
    };
  }
  serialize(): Record<string, any> {
    return this.allowedFields.reduce(
      (acc, field) => {
        if (this.normalizedPayload[field] !== undefined) {
          acc[field] = this.normalizedPayload[field];
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  }
}
