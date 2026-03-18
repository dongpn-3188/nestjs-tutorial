import { BadRequestException, Injectable } from '@nestjs/common';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../../common/constants';
import { TagRepository } from './tag.repository';
import { Tag } from '../../database/Entities/tag.entity';
import { SharedService } from '../../common/shared.service';

// Maximum number of tags that can be returned in a single page
const MAX_TAG_PAGE_LIMIT = 100;

@Injectable()
export class TagService {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly sharedService: SharedService,
  ) {}

  private serializeTags(
    tags: Tag[],
    offset: number,
    limit: number,
    totalCount: number,
  ) {
    return {
      tags: tags.map((tag) => tag.name),
      page: {
        itemCount: limit,
        pageNumber: offset + 1,
        totalItems: totalCount,
      },
    };
  }

  findTagsByNames(tagNames: string[]): Promise<Tag[]> {
    return this.tagRepository.findTagsByNames(tagNames);
  }

  async findAll(limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET) {
    const { limit: normalizedLimit, offset: normalizedOffset } =
      this.sharedService.normalizedLimitAndOffset(
        limit,
        offset,
        MAX_TAG_PAGE_LIMIT,
      );
    const [tags, totalCount] = await this.tagRepository.findAll(normalizedLimit, normalizedOffset);
    return this.serializeTags(tags, normalizedOffset, normalizedLimit, totalCount);
  }

  async searchByName(keyword: string, limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET) {
    const normalizedKeyword = keyword?.trim();
    if (!normalizedKeyword) {
      throw new BadRequestException(
        this.sharedService.getSharedMessage('message.TAG_SEARCH_KEYWORD_REQUIRED'),
      );
    }

    const { limit: normalizedLimit, offset: normalizedOffset } =
      this.sharedService.normalizedLimitAndOffset(
        limit,
        offset,
        MAX_TAG_PAGE_LIMIT,
      );
    const [tags, totalCount] = await this.tagRepository.searchByName(
      normalizedKeyword,
      normalizedLimit,
      normalizedOffset,
    );

    return this.serializeTags(tags, normalizedOffset, normalizedLimit, totalCount);
  }
}
