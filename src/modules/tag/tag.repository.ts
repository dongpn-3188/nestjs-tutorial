import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tag } from '../../database/Entities/tag.entity';

@Injectable()
export class TagRepository {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  findTagsByNames(tagNames: string[]): Promise<Tag[]> {
    if (tagNames.length === 0) {
      return Promise.resolve([]);
    }

    return this.tagRepository.find({
      where: {
        name: In(tagNames),
      },
    });
  }

  findAll(limit: number, offset: number): Promise<[Tag[], number]> {
    return this.tagRepository.findAndCount({
      order: {
        name: 'ASC',
      },
      take: limit,
      skip: offset,
    });
  }
}
