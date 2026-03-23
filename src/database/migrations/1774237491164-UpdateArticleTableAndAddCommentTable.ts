import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateArticleTableAndAddCommentTable1774237491164 implements MigrationInterface {
    name = 'UpdateArticleTableAndAddCommentTable1774237491164'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`comment\` (\`id\` int NOT NULL AUTO_INCREMENT, \`body\` text NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`article_id\` int NOT NULL, \`user_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`deleted_at\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`comment\` ADD CONSTRAINT \`FK_03a590c26b0910b0bb49682b1e3\` FOREIGN KEY (\`article_id\`) REFERENCES \`article\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`comment\` ADD CONSTRAINT \`FK_bbfe153fa60aa06483ed35ff4a7\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`comment\` DROP FOREIGN KEY \`FK_bbfe153fa60aa06483ed35ff4a7\``);
        await queryRunner.query(`ALTER TABLE \`comment\` DROP FOREIGN KEY \`FK_03a590c26b0910b0bb49682b1e3\``);
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`deleted_at\``);
        await queryRunner.query(`DROP TABLE \`comment\``);
    }

}
