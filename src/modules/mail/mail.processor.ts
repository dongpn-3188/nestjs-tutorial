import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { I18nService } from 'nestjs-i18n';

@Processor('email')
@Injectable()
export class MailProcessor {
  constructor(
    private readonly mailerService: MailerService,
    private readonly i18n: I18nService,
    private readonly logger: Logger,
  ) {}

  @Process('welcome')
  async handleWelcomeEmail(job: Job<{ email: string; name: string }>) {
    const { email, name } = job.data;
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: this.i18n.t('template.WELCOME_SUBJECT', { args: { username: name } }),
        text: this.i18n.t('template.WELCOME', { args: { username: name } }),
      });
    } catch (error) {
      this.logger.error(
        'Failed to send welcome email',
        {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          jobId: job.id,
          processName: 'welcome',
        },
      );
    }
  }

  @Process('follow-up')
  async handleFollowUpEmail(job: Job<{ followUser: string; targetUser: string; targetEmail: string }>) {
    const { followUser, targetUser, targetEmail } = job.data;
    try {
      await this.mailerService.sendMail({
        to: targetEmail,
        subject: this.i18n.t('template.FOLLOW_UP_SUBJECT', { args: { followUser } }),
        text: this.i18n.t('template.FOLLOW_UP', { args: { targetUser, followUser } }),
      });
    } catch (error) {
      this.logger.error(
        'Failed to send follow-up email',
        {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          jobId: job.id,
          processName: 'follow-up',
        },
      );
    }
  }

  @Process('daily-report')
  async handleDailyReportEmail(job: Job<{ targetEmail: string; bodyText: string }>) {
    const { targetEmail, bodyText } = job.data;
    try {
      await this.mailerService.sendMail({
        to: targetEmail,
        subject: this.i18n.t('template.DAILY_REPORT_SUBJECT'),
        text: bodyText,
      });
    } catch (error) {
      this.logger.error(
        'Failed to send daily report email',
        {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          jobId: job.id,
          processName: 'daily-report',
        },
      );
    }
  }
}
