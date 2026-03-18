import { Tag } from '../../../database/Entities/tag.entity';
import { TagItemSerializer, TagItemSerializerType } from './tag-item.serializer';

export type TagSerializerType = 'LIST';

const TAG_FIELDS: Record<TagSerializerType, string[]> = {
  LIST: ['tags', 'page'],
};

export type TagListSerializerPayload = {
  tags: Tag[];
  offset: number;
  limit: number;
  totalCount: number;
};

export class TagSerializer {
  constructor(
    private readonly payload: TagListSerializerPayload,
    private readonly options: { type: TagSerializerType; tagType: TagItemSerializerType },
  ) {}

  private get allowedFields(): string[] {
    return TAG_FIELDS[this.options.type] || [];
  }

  private get normalizedPayload(): Record<string, any> {
    return {
      tags: this.payload.tags.map((tag) =>
        new TagItemSerializer(tag, { type: this.options.tagType }).serialize(),
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
