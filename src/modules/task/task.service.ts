import { Injectable } from '@nestjs/common';
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
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) 
  handleCron() {
    console.debug('Called when the cron job runs at midnight');
    this.articleService.getTopFavoritedArticles(5).then(articles => {
      const reportContent = articles.map((article, index) => ` ${index + 1}. ${article.slug} Favorited: ${article.favoritesCount}`).join('\n');
      this.mailService.sendDailyReportEmail({
        targetEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
        bodyText: this.i18n.t('template.DAILY_REPORT', { args: { reportContent } }),
      });
    });
  }

}