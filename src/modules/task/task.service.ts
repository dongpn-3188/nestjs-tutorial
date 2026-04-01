import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from '../mail/mail.service';
import { ArticleService } from '../article/article.service';
import { I18nService } from 'nestjs-i18n';


@Injectable()
export class TasksService {
  constructor(
    private readonly mailService: MailService,
    private readonly articleService: ArticleService,
    private readonly i18n: I18nService,
    private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) 
  async handleCron(): Promise<void> {
    this.logger.log('Called when the cron job runs at midnight');
    try {
      const articles = await this.articleService.getTopFavoritedArticles(5);
      const reportContent = articles
        .map((article, index) => ` ${index + 1}. ${article.slug} Favorited: ${article.favoritesCount}`)
        .join('\n');
      await this.mailService.sendDailyReportEmail({
        targetEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
        bodyText: this.i18n.t('template.DAILY_REPORT', { args: { reportContent } }),
      });
    } catch (error) {
      this.logger.error(
        'Failed to send daily report email',
        {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          processName: 'daily-report',
        },
      );
    }
  }

}