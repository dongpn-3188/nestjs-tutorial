import { Injectable } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tag } from '../../database/Entities/tag.entity';

@Injectable()
@Command({
  name: 'insert-tag',
  description: 'Insert a list of tags and skip existing ones',
  arguments: '<names...>',
})
export class InsertTagCommand extends CommandRunner {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {
    super();
  }

  async run(inputs: string[]): Promise<void> {
    const normalizedTags = Array.from(
      new Set(
        inputs
          .flatMap((input) => input.split(','))
          .map((name) => name.trim())
          .filter(Boolean),
      ),
    );

    if (normalizedTags.length === 0) {
      console.error('No Tag found in input. Please provide at least one tag name.');
      return;
    }

    const existingTags = await this.tagRepository.find({
      where: { name: In(normalizedTags) },
    });
    const existingNameSet = new Set(existingTags.map((tag) => tag.name));
    const newTags = normalizedTags.filter((name) => !existingNameSet.has(name));

    if (newTags.length === 0) {
      console.log('No new tags to insert. All provided tags already exist.');
      return;
    }

    const tagsToInsert = newTags.map((name) => this.tagRepository.create({ name }));
    const savedTags = await this.tagRepository.save(tagsToInsert);

    console.log(`Inserted ${savedTags.length} tag(s)`);
  }
}
