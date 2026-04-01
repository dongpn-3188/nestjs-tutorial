import { Module } from '@nestjs/common';
import { TasksService } from './task.service';
import { MailModule } from '../mail/mail.module';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [ 
    MailModule,
    ArticleModule,
  ],  
  providers: [TasksService],
})
export class TasksModule {}