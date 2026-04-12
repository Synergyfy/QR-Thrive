import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { VemtapService } from '../src/integration/vemtap.service';
import { PaystackService } from '../src/payments/paystack.service';
import cookieParser from 'cookie-parser';

describe('Vemtap Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let vemtapService: VemtapService;
  let paystackService: PaystackService;
  let adminAccessToken: string;
  let adminId: string;

  const adminEmail = `admin-vemtap-${Math.random()}@example.com`;
  const userEmail = `user-vemtap-${Math.random()}@example.com`;
  const vemtapPlanId = 'vemtap-test-plan-123';

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
    vemtapService = app.get<VemtapService>(VemtapService);
    paystackService = app.get<PaystackService>(PaystackService);

    // Create Admin
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signup-admin')
      .send({
        email: adminEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'Admin',
        lastName: 'User',
        adminSecret: process.env.ADMIN_CREATION_SECRET || 'dev_secret',
      });

    adminId = res.body.user.id;
    const cookies = res.get('Set-Cookie') as string[];
    adminAccessToken = cookies.find((c) => c.startsWith('accessToken='))!.split(';')[0].split('=')[1];

    // Spy on VemtapService
    jest.spyOn(vemtapService, 'fetchActivePlans').mockResolvedValue([{ id: vemtapPlanId, name: 'Vemtap Pro' }]);
    jest.spyOn(vemtapService, 'provisionUser').mockResolvedValue({ success: true });
    
    // Spy on Paystack signature verification to bypass it
    jest.spyOn(paystackService, 'verifyWebhookSignature').mockReturnValue(true);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, userEmail] } } });
    await prisma.plan.deleteMany({ where: { vemtapPlanId } });
    await prisma.$disconnect();
    await app.close();
  });

  describe('Admin Endpoints', () => {
    it('should fetch Vemtap plans (Admin only)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/vemtap/plans')
        .set('Cookie', [`accessToken=${adminAccessToken}`])
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body[0].id).toBe(vemtapPlanId);
    });

    it('should create a plan with vemtapPlanId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/plans')
        .set('Cookie', [`accessToken=${adminAccessToken}`])
        .send({
          name: 'Bundled Plan',
          qrCodeLimit: 100,
          qrCodeTypes: ['url'],
          vemtapPlanId: vemtapPlanId,
          highIncomeMonthlyUSD: 29.99
        })
        .expect(201);

      expect(res.body.vemtapPlanId).toBe(vemtapPlanId);
    });
  });

  describe('Provisioning Flow', () => {
    it('should trigger Vemtap provisioning on successful Paystack payment', async () => {
      // 1. Create a user to be upgraded
      await prisma.user.create({
        data: { email: userEmail, firstName: 'John', lastName: 'Doe' }
      });

      // 2. Find the plan we created
      const plan = await prisma.plan.findUnique({ where: { name: 'Bundled Plan' } });

      // 3. Simulate Paystack Webhook
      await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .set('x-paystack-signature', 'valid_signature')
        .send({
          event: 'charge.success',
          data: {
            customer: { email: userEmail, customer_code: `CUS_${Math.random()}` },
            metadata: { planId: plan?.id, interval: 'monthly' }
          }
        })
        .expect(200);

      // 4. Verify provisioning was called
      expect(vemtapService.provisionUser).toHaveBeenCalledWith(
        userEmail,
        'John',
        'Doe',
        vemtapPlanId
      );

      // 5. Verify user is upgraded in DB
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      expect(user?.planId).toBe(plan?.id);
      expect(user?.subscriptionStatus).toBe('active');
    });
  });
});
