import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TagService } from './tag.service';

@ApiTags('Tags')
@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiQuery({ name: 'itemCount', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 0 })
  async findAll(
    @Query('itemCount', new ParseIntPipe({ optional: true })) itemCount?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.tagService.findAll(itemCount, page);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search tags by keyword' })
  @ApiQuery({ name: 'q', required: true, type: String, example: 'nest' })
  @ApiQuery({ name: 'itemCount', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 0 })
  async searchByName(
    @Query('q') keyword: string,
    @Query('itemCount', new ParseIntPipe({ optional: true })) itemCount?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.tagService.searchByName(keyword, itemCount, page);
  }
}
