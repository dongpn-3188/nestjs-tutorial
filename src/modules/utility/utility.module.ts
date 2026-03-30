import { Module } from '@nestjs/common';
import { UtilityService } from './utility.service';
import { UtilityController } from './utility.controller';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [UsersModule, CommonModule],
  providers: [UtilityService],
  controllers: [UtilityController],
  exports: [UtilityService],
})
export class UtilityModule {}
