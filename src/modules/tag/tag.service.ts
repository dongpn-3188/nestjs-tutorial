import { BadRequestException, Injectable } from '@nestjs/common';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../../common/constants';
import { TagRepository } from './tag.repository';
import { SharedService } from '../../common/shared.service';
import { Tag } from '../../database/Entities/tag.entity';
import { TagSerializer } from './serializers/tag.serializer';

// Maximum number of tags that can be returned in a single page
const MAX_TAG_PAGE_LIMIT = 100;

@Injectable()
export class TagService {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly sharedService: SharedService,
  ) {}

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
    const [tags, totalCount] = await this.tagRepository.findAll(normalizedLimit, normalizedOffset * normalizedLimit); // convert page number to offset
    return new TagSerializer(
      {
        tags,
        offset: normalizedOffset,
        limit: normalizedLimit,
        totalCount,
      },
      { type: 'LIST', tagType: 'NAME' },
    ).serialize();
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
      normalizedOffset * normalizedLimit, // convert page number to offset
    );

    return new TagSerializer(
      {
        tags,
        offset: normalizedOffset,
        limit: normalizedLimit,
        totalCount,
      },
      { type: 'LIST', tagType: 'NAME' },
    ).serialize();
  }
}
