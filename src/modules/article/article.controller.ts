import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { GetArticleDto } from './dto/get-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Articles')
@ApiBearerAuth()
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all articles' })
  async findAll(@Query() query: GetArticleDto, @Req() req) {
    return this.articleService.findAll(query, req.user?.userId);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get articles feed by followed users' })
  @ApiQuery({ name: 'itemCount', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 0 })
  async findFeed(
    @Query('itemCount', new ParseIntPipe({ optional: true })) itemCount?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Req() req?,
  ) {
    return this.articleService.findFeed(itemCount, page, req.user.userId);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get article by slug' })
  async findOne(@Param('slug') slug: string, @Req() req) {
    return this.articleService.findOne(slug, req.user?.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create article' })
  async create(@Body() createArticleDto: CreateArticleDto, @Req() req) {
    return this.articleService.create(req.user.userId, createArticleDto);
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update article by slug' })
  async update(
    @Param('slug') slug: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Req() req,
  ) {
    return this.articleService.update(slug, req.user.userId, updateArticleDto);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete article by slug' })
  async remove(@Param('slug') slug: string, @Req() req) {
    return this.articleService.remove(slug, req.user.userId);
  }

  @Post(':slug/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Favorite article by slug' })
  async favorite(@Param('slug') slug: string, @Req() req) {
    return this.articleService.favorite(slug, req.user.userId);
  }

  @Delete(':slug/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unfavorite article by slug' })
  async unfavorite(@Param('slug') slug: string, @Req() req) {
    return this.articleService.unfavorite(slug, req.user.userId);
  }
}


