import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../src/app.module';
import { createE2eApp } from '../../helpers/create-e2e-app';

dotenv.config({ path: join(process.cwd(), '.env.test'), override: true });

let app: INestApplication | undefined;
let dataSource: DataSource | undefined;

export async function createIntegrationApp(): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> {
  if (app && dataSource) return { app, dataSource };

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = createE2eApp(moduleFixture);
  await app.init();
  dataSource = app.get(DataSource);

  return { app, dataSource: dataSource! };
}

export async function closeIntegrationApp(): Promise<void> {
  if (app) {
    await app.close();
    app = undefined;
    dataSource = undefined;
  }
}
