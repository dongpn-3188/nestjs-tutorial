import {
  BadRequestException,
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';

export function createE2eApp(moduleFixture: TestingModule): INestApplication<App> {
  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const messages = errors
          .map((err) => (err.constraints ? Object.values(err.constraints)[0] : ''))
          .filter(Boolean);
        const [firstMessage] = messages;
        return new BadRequestException({
          statusCode: 400,
          errors: 'Bad Request',
          message: firstMessage ?? 'Validation failed',
        });
      },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  return app;
}