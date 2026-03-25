import { Comment } from '../../../database/Entities/comment.entity';

export type CommentItemSerializerType = 'DEFAULT';
const COMMENT_ITEM_FIELDS: Record<CommentItemSerializerType, string[]> = {
  DEFAULT: ['id', 'body', 'author', 'createdAt', 'updatedAt'],
};

type CommentItemSerializerOptions = {
  type: CommentItemSerializerType;
};

export class CommentItemSerializer {
  constructor(
    private readonly comment: Comment,
    private readonly options: CommentItemSerializerOptions,
  ) {}

  private get allowedFields(): string[] {
    return COMMENT_ITEM_FIELDS[this.options.type] || [];
  }

  private get normalizedComment(): Record<string, any> {
    return {
      id: this.comment.id,
      body: this.comment.body,
      author: {
        id: this.comment.author?.id,
        username: this.comment.author?.username,
      },
      createdAt: this.comment.createdAt,
      updatedAt: this.comment.updatedAt,
    };
  }

  serialize(): Record<string, any> {
    return this.allowedFields.reduce(
      (acc, field) => {
        if (this.normalizedComment[field] !== undefined) {
          acc[field] = this.normalizedComment[field];
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  }
}
