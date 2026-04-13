import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as crypto from 'crypto';
import cookieParser from 'cookie-parser';

describe('Integration API & SSO (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const rawApiKey = 'qr_test_integration_key_12345';
  const hashedApiKey = crypto.createHash('sha256').update(rawApiKey).digest('hex');
  let userId: string;
  let qrCodeId: string;
  const userEmail = `integration-test-${Math.random()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Seed an API Key
    await prisma.apiKey.create({
      data: {
        name: 'Test Integration',
        key: hashedApiKey,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.magicLink.deleteMany({ where: { user: { email: userEmail } } });
    await prisma.qRCode.deleteMany({ where: { user: { email: userEmail } } });
    await prisma.apiKey.deleteMany({ where: { name: 'Test Integration' } });
    await prisma.user.deleteMany({ where: { email: userEmail } });
    
    await prisma.$disconnect();
    await app.close();
  });

  describe('Authentication', () => {
    it('should fail with missing API Key', () => {
      return request(app.getHttpServer())
        .post('/api/v1/integration/users')
        .send({ email: userEmail, firstName: 'Test', lastName: 'User' })
        .expect(401);
    });

    it('should fail with invalid API Key', () => {
      return request(app.getHttpServer())
        .post('/api/v1/integration/users')
        .set('X-API-KEY', 'invalid_key')
        .send({ email: userEmail, firstName: 'Test', lastName: 'User' })
        .expect(401);
    });
  });

  describe('User Management', () => {
    it('should ensure a user exists (create)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/integration/users')
        .set('X-API-KEY', rawApiKey)
        .send({
          email: userEmail,
          firstName: 'Integration',
          lastName: 'Tester',
        })
        .expect(201);

      expect(res.body.email).toBe(userEmail);
      expect(res.body.id).toBeDefined();
      userId = res.body.id;
    });

    it('should return existing user on subsequent call', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/integration/users')
        .set('X-API-KEY', rawApiKey)
        .send({
          email: userEmail,
          firstName: 'Integration',
          lastName: 'Tester',
        })
        .expect(201);

      expect(res.body.id).toBe(userId);
    });
  });

  describe('QR Code Management', () => {
    it('should create a QR code for the user', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/integration/users/${userId}/qr-codes`)
        .set('X-API-KEY', rawApiKey)
        .send({
          name: 'Integration QR',
          type: 'url',
          data: { url: 'https://example.com' },
          design: {},
          frame: {},
        })
        .expect(201);

      expect(res.body.userId).toBe(userId);
      qrCodeId = res.body.id;
    });

    it('should fetch QR code details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/integration/users/${userId}/qr-codes/${qrCodeId}`)
        .set('X-API-KEY', rawApiKey)
        .expect(200);

      expect(res.body.id).toBe(qrCodeId);
    });

    it('should fetch scan activities', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/integration/users/${userId}/qr-codes/${qrCodeId}/scans`)
        .set('X-API-KEY', rawApiKey)
        .expect(200);
    });

    it('should fail if user does not own the QR code', async () => {
      // Create another user
      const otherEmail = `other-${Math.random()}@example.com`;
      const otherUser = await prisma.user.create({
        data: { email: otherEmail, firstName: 'Other', lastName: 'User' }
      });

      await request(app.getHttpServer())
        .get(`/api/v1/integration/users/${otherUser.id}/qr-codes/${qrCodeId}`)
        .set('X-API-KEY', rawApiKey)
        .expect(404); // findFirst with userId filter will return 404 in QRCodesService.findOne

      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('Magic Links & SSO', () => {
    let magicLinkUrl: string;
    let token: string;

    it('should generate a magic link', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/integration/users/${userId}/magic-link`)
        .set('X-API-KEY', rawApiKey)
        .expect(201);

      expect(res.body.url).toContain('/v1/auth/magic-login?token=');
      magicLinkUrl = res.body.url;
      token = magicLinkUrl.split('token=')[1];
    });

    it('should validate magic link and redirect to dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/auth/magic-login?token=${token}`)
        .expect(302);

      expect(res.header.location).toContain('/dashboard?auth_success=true');
      
      // Verify cookies are set
      const cookies = res.get('Set-Cookie') as string[];
      expect(cookies.some(c => c.startsWith('accessToken='))).toBeTruthy();
      expect(cookies.some(c => c.startsWith('refreshToken='))).toBeTruthy();
    });

    it('should fail on re-using the same magic link', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/auth/magic-login?token=${token}`)
        .expect(302);

      expect(res.header.location).toContain('/login?error=invalid_link');
    });

    it('should fail on invalid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/magic-login?token=invalid_token')
        .expect(302);

      expect(res.header.location).toContain('/login?error=invalid_link');
    });
  });
});
