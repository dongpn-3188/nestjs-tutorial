import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpStatus } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  I18nValidationExceptionFilter,
  I18nValidationPipe,
  I18nValidationError,
} from 'nestjs-i18n';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { uploadsSubfolderOnlyMiddleware } from './common/uploads-subfolder.middleware';

const API_PREFIX = 'api';
const SWAGGER_DOCS_PATH = `${API_PREFIX}/swagger`;

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix(API_PREFIX);
  // Chặn truy cập trực tiếp uploads/, chỉ cho phép truy cập thư mục con
  app.use('/uploads', uploadsSubfolderOnlyMiddleware);
  app.useStaticAssets(join(__dirname, '../uploads'), {
    prefix: '/uploads/',
  });

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
          errors: 'Bad Request',
          message: firstErrorMessage ?? 'Validation failed',
        };
      },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
