import { Tag } from '../../../database/Entities/tag.entity';

export type TagItemSerializerType = 'NAME';
const TAG_ITEM_TYPE_NAME = 'NAME';

const TAG_ITEM_FIELDS: Record<TagItemSerializerType, string[]> = {
  [TAG_ITEM_TYPE_NAME]: ['name'],
};

export class TagItemSerializer {
  constructor(
    private readonly tag: Tag,
    private readonly options: { type: TagItemSerializerType },
  ) {}

  private get allowedFields(): string[] {
    return TAG_ITEM_FIELDS[this.options.type] || [];
  }

  serialize(): string | Record<string, any> {
    const serializedTag = this.allowedFields.reduce(
      (acc, field) => {
        if (this.tag[field] !== undefined) {
          acc[field] = this.tag[field];
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    if (this.options.type === TAG_ITEM_TYPE_NAME) {
      return serializedTag.name;
    }

    return serializedTag;
  }
}