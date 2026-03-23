import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsertTagCommand } from './commands/insert-tag.command';
import { Tag } from '../database/Entities/tag.entity';
import { Article } from '../database/Entities/article.entity';
import { User } from '../database/Entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nest_db',
      entities: [Tag, Article, User],
      synchronize: false,
      logging: true,
    }),
    TypeOrmModule.forFeature([Tag]),
  ],
  providers: [InsertTagCommand],
})
export class CliModule {}
