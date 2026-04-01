import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/Entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { CommonModule } from '../../common/common.module';
import { ProfilesController } from './profiles.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CommonModule, MailModule],
  controllers: [UsersController, ProfilesController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
