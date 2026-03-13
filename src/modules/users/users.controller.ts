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

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getCurrentUser(@Req() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Get(':id')
  async getUserProfile(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put()
  async update(@Body() updateUserDto: UpdateUserDto,@Req() req) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }
}
