import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateArticleAndTag1773729149466 implements MigrationInterface {
    name = 'CreateArticleAndTag1773729149466'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tag\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_6a9775008add570dc3e5a0bab7\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`article\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`body\` text NOT NULL, \`author_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`article_tag_links\` (\`articleId\` int NOT NULL, \`tagId\` int NOT NULL, INDEX \`IDX_7fbb773627a007a902a38f0ade\` (\`articleId\`), INDEX \`IDX_f39da5181ed9622f609f5d2aed\` (\`tagId\`), PRIMARY KEY (\`articleId\`, \`tagId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`article_favorite_links\` (\`article_id\` int NOT NULL, \`user_id\` int NOT NULL, INDEX \`IDX_3ec01f0dddb76f42b81dd6ad6b\` (\`article_id\`), INDEX \`IDX_0c2c5d2aa0f452b30b2206870a\` (\`user_id\`), PRIMARY KEY (\`article_id\`, \`user_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_follow_links\` (\`follower_id\` int NOT NULL, \`following_id\` int NOT NULL, INDEX \`IDX_c666b2ee5f8456f5f74b5b2b17\` (\`follower_id\`), INDEX \`IDX_8c97f623599e9b69a75bf87c09\` (\`following_id\`), PRIMARY KEY (\`follower_id\`, \`following_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`article\` ADD CONSTRAINT \`FK_16d4ce4c84bd9b8562c6f396262\` FOREIGN KEY (\`author_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`article_tag_links\` ADD CONSTRAINT \`FK_7fbb773627a007a902a38f0ade0\` FOREIGN KEY (\`articleId\`) REFERENCES \`article\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`article_tag_links\` ADD CONSTRAINT \`FK_f39da5181ed9622f609f5d2aed8\` FOREIGN KEY (\`tagId\`) REFERENCES \`tag\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`article_favorite_links\` ADD CONSTRAINT \`FK_3ec01f0dddb76f42b81dd6ad6be\` FOREIGN KEY (\`article_id\`) REFERENCES \`article\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`article_favorite_links\` ADD CONSTRAINT \`FK_0c2c5d2aa0f452b30b2206870ae\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_follow_links\` ADD CONSTRAINT \`FK_c666b2ee5f8456f5f74b5b2b172\` FOREIGN KEY (\`follower_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`user_follow_links\` ADD CONSTRAINT \`FK_8c97f623599e9b69a75bf87c096\` FOREIGN KEY (\`following_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_follow_links\` DROP FOREIGN KEY \`FK_8c97f623599e9b69a75bf87c096\``);
        await queryRunner.query(`ALTER TABLE \`user_follow_links\` DROP FOREIGN KEY \`FK_c666b2ee5f8456f5f74b5b2b172\``);
        await queryRunner.query(`ALTER TABLE \`article_favorite_links\` DROP FOREIGN KEY \`FK_0c2c5d2aa0f452b30b2206870ae\``);
        await queryRunner.query(`ALTER TABLE \`article_favorite_links\` DROP FOREIGN KEY \`FK_3ec01f0dddb76f42b81dd6ad6be\``);
        await queryRunner.query(`ALTER TABLE \`article_tag_links\` DROP FOREIGN KEY \`FK_f39da5181ed9622f609f5d2aed8\``);
        await queryRunner.query(`ALTER TABLE \`article_tag_links\` DROP FOREIGN KEY \`FK_7fbb773627a007a902a38f0ade0\``);
        await queryRunner.query(`ALTER TABLE \`article\` DROP FOREIGN KEY \`FK_16d4ce4c84bd9b8562c6f396262\``);
        await queryRunner.query(`DROP INDEX \`IDX_8c97f623599e9b69a75bf87c09\` ON \`user_follow_links\``);
        await queryRunner.query(`DROP INDEX \`IDX_c666b2ee5f8456f5f74b5b2b17\` ON \`user_follow_links\``);
        await queryRunner.query(`DROP TABLE \`user_follow_links\``);
        await queryRunner.query(`DROP INDEX \`IDX_0c2c5d2aa0f452b30b2206870a\` ON \`article_favorite_links\``);
        await queryRunner.query(`DROP INDEX \`IDX_3ec01f0dddb76f42b81dd6ad6b\` ON \`article_favorite_links\``);
        await queryRunner.query(`DROP TABLE \`article_favorite_links\``);
        await queryRunner.query(`DROP INDEX \`IDX_f39da5181ed9622f609f5d2aed\` ON \`article_tag_links\``);
        await queryRunner.query(`DROP INDEX \`IDX_7fbb773627a007a902a38f0ade\` ON \`article_tag_links\``);
        await queryRunner.query(`DROP TABLE \`article_tag_links\``);
        await queryRunner.query(`DROP TABLE \`article\``);
        await queryRunner.query(`DROP INDEX \`IDX_6a9775008add570dc3e5a0bab7\` ON \`tag\``);
        await queryRunner.query(`DROP TABLE \`tag\``);
    }

}
