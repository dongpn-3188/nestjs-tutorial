import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpStatus } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  I18nValidationExceptionFilter,
  I18nValidationPipe,
  I18nValidationError
} from 'nestjs-i18n';

const API_PREFIX = 'api';
const SWAGGER_DOCS_PATH = `${API_PREFIX}/swagger`;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(API_PREFIX);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS Tutorial API')
    .setDescription('API documentation for NestJS Tutorial project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(SWAGGER_DOCS_PATH, app, swaggerDocument);

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
