import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { MAX_SEND_EMAIL_RETRIES, EMAIL_RETRY_DELAY } from '../../common/constants';

@Injectable()
export class MailService {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  async sendWelcomeEmail(user: { email: string; name: string }) {
    await this.emailQueue.add('welcome', user, {
      attempts: MAX_SEND_EMAIL_RETRIES,            // Retry tối đa 3 lần
      backoff: EMAIL_RETRY_DELAY,          // Delay 5s trước mỗi retry
      removeOnComplete: true,
      removeOnFail: false,    // Giữ lại job lỗi để debug
    });
  }

  async sendFollowUpEmail(data: { followUser: string; targetUser: string; targetEmail: string }) {
    await this.emailQueue.add('follow-up', data, {
      attempts: MAX_SEND_EMAIL_RETRIES,
      backoff: EMAIL_RETRY_DELAY,
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async sendDailyReportEmail(data: { targetEmail: string; bodyText: string }) {
    await this.emailQueue.add('daily-report', data, {
      attempts: MAX_SEND_EMAIL_RETRIES,
      backoff: EMAIL_RETRY_DELAY,
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
