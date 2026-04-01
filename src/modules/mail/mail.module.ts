import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { BullModule } from '@nestjs/bull';
import { MailProcessor } from './mail.processor';
import { MailerModule } from '@nestjs-modules/mailer';
import { CommonModule } from '../../common/common.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: parseInt(configService.get<string>('MAIL_PORT') || '587', 10),
          secure: false,
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'),
          },
          debug: true,
          logger: true,
        },
        defaults: {
          from: `"Test Send Mail" <${configService.get<string>('MAIL_USER')}>`,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'email' },
    ),
    CommonModule,
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
