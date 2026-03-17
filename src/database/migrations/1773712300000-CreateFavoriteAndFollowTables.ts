import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateFavoriteAndFollowTables1773712300000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'article_favorite_links',
        columns: [
          {
            name: 'article_id',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'int',
            isPrimary: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'article_favorite_links',
      new TableForeignKey({
        columnNames: ['article_id'],
        referencedTableName: 'article',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'article_favorite_links',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'article_favorite_links',
      new TableIndex({
        name: 'IDX_article_favorite_links_article_id',
        columnNames: ['article_id'],
      }),
    );

    await queryRunner.createIndex(
      'article_favorite_links',
      new TableIndex({
        name: 'IDX_article_favorite_links_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_follow_links',
        columns: [
          {
            name: 'follower_id',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'following_id',
            type: 'int',
            isPrimary: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'user_follow_links',
      new TableForeignKey({
        columnNames: ['follower_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_follow_links',
      new TableForeignKey({
        columnNames: ['following_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'user_follow_links',
      new TableIndex({
        name: 'IDX_user_follow_links_follower_id',
        columnNames: ['follower_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_follow_links',
      new TableIndex({
        name: 'IDX_user_follow_links_following_id',
        columnNames: ['following_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'user_follow_links',
      'IDX_user_follow_links_following_id',
    );
    await queryRunner.dropIndex(
      'user_follow_links',
      'IDX_user_follow_links_follower_id',
    );

    const userFollowLinksTable = await queryRunner.getTable('user_follow_links');
    if (userFollowLinksTable) {
      const followForeignKeys = [...userFollowLinksTable.foreignKeys];
      for (const foreignKey of followForeignKeys) {
        await queryRunner.dropForeignKey('user_follow_links', foreignKey);
      }
    }
    await queryRunner.dropTable('user_follow_links');

    await queryRunner.dropIndex(
      'article_favorite_links',
      'IDX_article_favorite_links_user_id',
    );
    await queryRunner.dropIndex(
      'article_favorite_links',
      'IDX_article_favorite_links_article_id',
    );

    const articleFavoriteLinksTable = await queryRunner.getTable(
      'article_favorite_links',
    );
    if (articleFavoriteLinksTable) {
      const favoriteForeignKeys = [...articleFavoriteLinksTable.foreignKeys];
      for (const foreignKey of favoriteForeignKeys) {
        await queryRunner.dropForeignKey('article_favorite_links', foreignKey);
      }
    }
    await queryRunner.dropTable('article_favorite_links');
  }
}
