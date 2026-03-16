import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  async getCurrentUser(@Req() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile by id' })
  async getUserProfile(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateUserById(@Body() updateUserDto: UpdateUserDto,@Req() req) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }
}
