import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tag } from './tag.entity';
import { User } from './user.entity';
import { Comment } from './comment.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  // Slug is generated after first insert using the article id.
  @Column({ nullable: true })
  slug: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  body: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @ManyToMany(() => Tag, (tag) => tag.articles)
  @JoinTable({ name: 'article_tag_links' })
  tags: Tag[];

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToMany(() => User, (user) => user.favorites)
  @JoinTable({
    name: 'article_favorite_links',
    joinColumn: { name: 'article_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  favoritedBy: User[];

  @OneToMany(() => Comment, (comment) => comment.article)
  comments: Comment[];
}
