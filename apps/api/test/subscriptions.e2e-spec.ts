import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

describe('Subscriptions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let configService: ConfigService;
  let accessToken: string;
  let userId: string;
  const userEmail = `test-${Math.random()}@example.com`;
  const userPassword = 'Password123!';

  beforeAll(async () => {
    // Force environment variables for test
    process.env.PAYSTACK_SECRET_KEY = 'test_secret_key';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    configService = app.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    // Clean up test user
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
    await app.close();
  });

  it('Register a new user (FREE - Trial Active)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: userEmail,
        password: userPassword,
        confirmPassword: userPassword,
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.plan).toBe('FREE');
    userId = res.body.user.id;

    const cookies = res.get('Set-Cookie') as string[];
    const tokenCookie = cookies.find((c) => c.startsWith('accessToken='));
    if (tokenCookie) {
      accessToken = tokenCookie.split(';')[0].split('=')[1];
    }
  });

  let qrId: string;
  let shortId: string;

  it('Successfully create premium QR as FREE user during Trial', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/qr-codes')
      .set('Cookie', [`accessToken=${accessToken}`])
      .send({
        name: 'Trial Premium QR',
        type: 'pdf',
        data: {},
        design: {},
        frame: {},
      })
      .expect(201);

    qrId = res.body.id;
    shortId = res.body.shortId;
  });

  it('Succeed to scan QR during Trial', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/qr-codes/scan/${shortId}`)
      .expect(302);
  });

  it('Expire Trial manually in DB', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);

    await prisma.user.update({
      where: { id: userId },
      data: { createdAt: oldDate },
    });
  });

  it('Fail to create QR after Trial expires', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/qr-codes')
      .set('Cookie', [`accessToken=${accessToken}`])
      .send({
        name: 'Post-Trial QR',
        type: 'url',
        data: {},
        design: {},
        frame: {},
      })
      .expect(403);
  });

  it('Fail to scan existing QR after Trial expires', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/qr-codes/scan/${shortId}`)
      .expect(403);
  });

  it('Simulate Paystack upgrade to PRO', async () => {
    const secretKey =
      configService.get<string>('PAYSTACK_SECRET_KEY') || 'access_secret';
    const customerCode = `CUST_${Math.random().toString(36).substring(7)}`;

    const payload = {
      event: 'charge.success',
      data: {
        customer: { email: userEmail, customer_code: customerCode },
        plan: { interval: 'monthly' },
      },
    };
    const bodyString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha512', secretKey)
      .update(bodyString)
      .digest('hex');

    await request(app.getHttpServer())
      .post('/api/v1/payments/webhook')
      .set('x-paystack-signature', signature)
      .send(payload)
      .expect(200);

    const updatedUser = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { plan: true }
    });
    expect(updatedUser?.plan?.name).toBe('Pro');
  });

  it('Successfully create and scan after PRO upgrade', async () => {
    // Create new
    await request(app.getHttpServer())
      .post('/api/v1/qr-codes')
      .set('Cookie', [`accessToken=${accessToken}`])
      .send({
        name: 'Pro QR',
        type: 'pdf',
        data: {},
        design: {},
        frame: {},
      })
      .expect(201);

    // Scan old one (should work now)
    await request(app.getHttpServer())
      .get(`/api/v1/qr-codes/scan/${shortId}`)
      .expect(302);
  });
});
