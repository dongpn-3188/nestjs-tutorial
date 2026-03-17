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
    // article_favorite_links: composite PK (article_id, user_id)
    // - article_id is the leftmost PK prefix → already indexed by PK, no extra index needed
    // - user_id is not covered by PK alone → explicit index before FK to prevent MySQL auto-index
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

    await queryRunner.createIndex(
      'article_favorite_links',
      new TableIndex({
        name: 'IDX_article_favorite_links_user_id',
        columnNames: ['user_id'],
      }),
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

    // user_follow_links: composite PK (follower_id, following_id)
    // - follower_id is the leftmost PK prefix → already indexed by PK, no extra index needed
    // - following_id is not covered by PK alone → explicit index before FK to prevent MySQL auto-index
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

    await queryRunner.createIndex(
      'user_follow_links',
      new TableIndex({
        name: 'IDX_user_follow_links_following_id',
        columnNames: ['following_id'],
      }),
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const userFollowLinksTable = await queryRunner.getTable('user_follow_links');
    if (userFollowLinksTable) {
      for (const foreignKey of userFollowLinksTable.foreignKeys) {
        await queryRunner.dropForeignKey('user_follow_links', foreignKey);
      }
    }
    await queryRunner.dropIndex(
      'user_follow_links',
      'IDX_user_follow_links_following_id',
    );
    await queryRunner.dropTable('user_follow_links');

    const articleFavoriteLinksTable = await queryRunner.getTable(
      'article_favorite_links',
    );
    if (articleFavoriteLinksTable) {
      for (const foreignKey of articleFavoriteLinksTable.foreignKeys) {
        await queryRunner.dropForeignKey('article_favorite_links', foreignKey);
      }
    }
    await queryRunner.dropIndex(
      'article_favorite_links',
      'IDX_article_favorite_links_user_id',
    );
    await queryRunner.dropTable('article_favorite_links');
  }
}
