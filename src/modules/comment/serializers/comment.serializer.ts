import { Comment } from '../../../database/Entities/comment.entity';
import {
  CommentItemSerializer,
  CommentItemSerializerType,
} from './comment-item.serializer';

export type CommentSerializerType = 'LIST';

const COMMENT_FIELDS: Record<CommentSerializerType, string[]> = {
  LIST: ['comments', 'page'],
};

export type CommentListSerializerPayload = {
  comments: Comment[];
  limit: number;
  offset: number;
  totalCount: number;
};

export class CommentSerializer {
  constructor(
    private readonly payload: CommentListSerializerPayload,
    private readonly options: {
      type: CommentSerializerType;
      commentType: CommentItemSerializerType;
    },
  ) {}

  private get allowedFields(): string[] {
    return COMMENT_FIELDS[this.options.type] || [];
  }

  private get normalizedPayload(): Record<string, any> {
    return {
      comments: this.payload.comments.map((comment) =>
        new CommentItemSerializer(comment, {
          type: this.options.commentType,
        }).serialize(),
      ),
      page: {
        itemCount: this.payload.limit,
        pageNumber: this.payload.offset + 1,
        totalItems: this.payload.totalCount,
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
