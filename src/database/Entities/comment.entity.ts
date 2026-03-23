import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Article } from './article.entity';
import { User } from './user.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  body: string;

  @ManyToOne(() => Article, { nullable: false })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  author: User;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
