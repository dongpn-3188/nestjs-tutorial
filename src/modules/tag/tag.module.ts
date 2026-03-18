import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from '../../database/Entities/tag.entity';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { TagRepository } from './tag.repository';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tag]), CommonModule],
  controllers: [TagController],
  providers: [TagService, TagRepository],
  exports: [TagService],
})
export class TagModule {}
