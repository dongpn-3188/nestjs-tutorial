import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpStatus } from '@nestjs/common';
import {
  I18nValidationExceptionFilter,
  I18nValidationPipe,
  I18nValidationError
} from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
    }),
  );
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      detailedErrors: true,
      responseBodyFormatter: (
        _host,
        _exception,
        formattedErrors: I18nValidationError[],
      ) => {
        const customErrorMessages = formattedErrors
          .map((err) =>
            err.constraints ? Object.values(err.constraints)[0] : '',
          )
          .filter(Boolean);
        const [firstErrorMessage] = customErrorMessages;

        return {
          statusCode: HttpStatus.BAD_REQUEST,
          errors: "Bad Request",
          message: firstErrorMessage ?? 'Validation failed',
        };
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
