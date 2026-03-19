import { Article } from '../../../database/Entities/article.entity';
export type ArticleItemSerializerType = 'DETAIL';
const ARTICLE_ITEM_FIELDS: Record<ArticleItemSerializerType, string[]> = {
  DETAIL: [
    'id',
    'slug',
    'title',
    'description',
    'body',
    'tagList',
    'favorited',
    'favoritesCount',
    'author',
  ],
};
type ArticleItemSerializerOptions = {
  type: ArticleItemSerializerType;
  currentUserId?: number;
  buildSlug: (id: number, title: string) => string;
};
export class ArticleItemSerializer {
  constructor(
    private readonly article: Article,
    private readonly options: ArticleItemSerializerOptions,
  ) {}
  private get allowedFields(): string[] {
    return ARTICLE_ITEM_FIELDS[this.options.type] || [];
  }
  private get normalizedArticle(): Record<string, any> {
    return {
      id: this.article.id,
      slug:
        this.article.slug ||
        this.options.buildSlug(this.article.id, this.article.title),
      title: this.article.title,
      description: this.article.description,
      body: this.article.body,
      tagList: this.article.tags?.map((tag) => tag.name) || [],
      favorited:
        !!this.options.currentUserId &&
        !!this.article.favoritedBy?.some(
          (user) => user.id === this.options.currentUserId,
        ),
      favoritesCount: this.article.favoritedBy?.length || 0,
      author: {
        username: this.article.author?.username,
        bio: this.article.author?.bio,
        image: this.article.author?.avatar,
        following: false,
      },
    };
  }
  serialize(): Record<string, any> {
    const normalizedArticle = this.normalizedArticle;
    return this.allowedFields.reduce(
      (acc, field) => {
        if (normalizedArticle[field] !== undefined) {
          acc[field] = normalizedArticle[field];
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  }
}
