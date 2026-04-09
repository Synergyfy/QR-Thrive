import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('QRCodesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/qr-codes/short/:shortId (GET) - bypasses auth', () => {
    return request(app.getHttpServer())
      .get('/qr-codes/short/non_existent_id')
      .expect(404);
  });

  it('/qr-codes (GET) - fails without auth', () => {
    return request(app.getHttpServer()).get('/qr-codes').expect(401);
  });
});
