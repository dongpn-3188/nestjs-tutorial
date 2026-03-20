import { MigrationInterface, QueryRunner } from "typeorm";
export class UpdateArticleTable1773903357513 implements MigrationInterface {
    name = 'UpdateArticleTable1773903357513'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`slug\` varchar(255) NULL`);
}

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`slug\``);
} }
