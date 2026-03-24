import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Comments')
@Controller()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('articles/:slug/comments')
  @ApiOperation({ summary: 'Get all comments by article slug' })
  @ApiQuery({ name: 'itemCount', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 0 })
  async getComments(
    @Param('slug') slug: string,
    @Query('itemCount', new ParseIntPipe({ optional: true }))
    itemCount?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.commentService.findAllByArticleSlug(slug, itemCount, page);
  }

  @Post('articles/:slug/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create comment by article slug' })
  async createComment(
    @Param('slug') slug: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req,
  ) {
    return this.commentService.create(slug, req.user.userId, createCommentDto);
  }

  @Delete('articles/:slug/comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete comment by id' })
  async deleteComment(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ) {
    return this.commentService.remove(slug, id, req.user.userId);
  }
}
