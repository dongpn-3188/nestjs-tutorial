import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Article } from './article.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  bio: string;

  @OneToMany(() => Article, (article) => article.author)
  articles: Article[];

  @ManyToMany(() => Article, 'favoritedBy')
  favorites: Article[];

  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({
    name: 'user_follow_links',
    joinColumn: { name: 'follower_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'following_id', referencedColumnName: 'id' },
  })
  following: User[];

  @ManyToMany(() => User, (user) => user.following)
  followers: User[];
}