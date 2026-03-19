import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get profile by id' })
  async getProfile(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.usersService.findProfileById(id, req.user?.userId);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Follow user by id' })
  async follow(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.usersService.follow(id, req.user.userId);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unfollow user by id' })
  async unfollow(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.usersService.unfollow(id, req.user.userId);
  }
}
