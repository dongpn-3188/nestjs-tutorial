import { Injectable } from '@nestjs/common';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../../common/constants';
import { TagRepository } from './tag.repository';
import { Tag } from '../../database/Entities/tag.entity';

// Maximum number of tags that can be returned in a single page
const MAX_TAG_PAGE_LIMIT = 100;

@Injectable()
export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  findTagsByNames(tagNames: string[]): Promise<Tag[]> {
    return this.tagRepository.findTagsByNames(tagNames);
  }

  async findAll(limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET) {
    const normalizedLimit = Math.min(Math.max(limit, 1), MAX_TAG_PAGE_LIMIT);
    const normalizedOffset = Math.max(offset, 0);
    const [tags, totalCount] = await this.tagRepository.findAll(normalizedLimit, normalizedOffset);
    return {
      tags: tags.map((tag) => tag.name),
      page: {
        limit: normalizedLimit,
        offset: normalizedOffset,
        total: totalCount,
      },
    };
  }
}
