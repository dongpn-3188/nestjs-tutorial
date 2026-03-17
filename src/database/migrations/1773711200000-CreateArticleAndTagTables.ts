import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateArticleAndTagTables1773711200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tag',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'article',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'body',
            type: 'text',
          },
          {
            name: 'author_id',
            type: 'int',
          },
        ],
      }),
      true,
    );

    // article.author_id: create explicit index before FK to prevent MySQL auto-generating one
    await queryRunner.createIndex(
      'article',
      new TableIndex({
        name: 'IDX_article_author_id',
        columnNames: ['author_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'article',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // article_tag_links: composite PK (articleId, tagId)
    // - articleId is the leftmost PK prefix → already indexed by PK, no extra index needed
    // - tagId is not covered by PK alone → explicit index before FK to prevent MySQL auto-index
    await queryRunner.createTable(
      new Table({
        name: 'article_tag_links',
        columns: [
          {
            name: 'articleId',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'tagId',
            type: 'int',
            isPrimary: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'article_tag_links',
      new TableIndex({
        name: 'IDX_article_tag_links_tagId',
        columnNames: ['tagId'],
      }),
    );

    await queryRunner.createForeignKey(
      'article_tag_links',
      new TableForeignKey({
        columnNames: ['articleId'],
        referencedTableName: 'article',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'article_tag_links',
      new TableForeignKey({
        columnNames: ['tagId'],
        referencedTableName: 'tag',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const joinTable = await queryRunner.getTable('article_tag_links');
    if (joinTable) {
      for (const foreignKey of joinTable.foreignKeys) {
        await queryRunner.dropForeignKey('article_tag_links', foreignKey);
      }
    }
    await queryRunner.dropIndex('article_tag_links', 'IDX_article_tag_links_tagId');
    await queryRunner.dropTable('article_tag_links');

    const articleTable = await queryRunner.getTable('article');
    if (articleTable) {
      const authorForeignKey = articleTable.foreignKeys.find((fk) =>
        fk.columnNames.includes('author_id'),
      );
      if (authorForeignKey) {
        await queryRunner.dropForeignKey('article', authorForeignKey);
      }
    }
    await queryRunner.dropIndex('article', 'IDX_article_author_id');
    await queryRunner.dropTable('article');
    await queryRunner.dropTable('tag');
  }
}
