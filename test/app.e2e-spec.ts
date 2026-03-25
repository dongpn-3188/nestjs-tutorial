import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';
import { createE2eApp } from './helpers/create-e2e-app';

describe('AppController', () => {
  let app: INestApplication<App>;

  const mockAppService = {
    getHello: jest.fn().mockReturnValue('Hello World!'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    app = createE2eApp(moduleFixture);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api', () => {
    it('returns 200', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200);
    });
  });
});
