import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import cookieParser from 'cookie-parser';

describe('Extended QR Codes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  const userEmail = `test-extended-${Math.random()}@example.com`;
  const userPassword = 'Password123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Signup & Login
    const signupRes = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: userEmail,
        password: userPassword,
        confirmPassword: userPassword,
        firstName: 'Extended',
        lastName: 'Tester',
      });

    userId = signupRes.body.user.id;
    const cookies = signupRes.get('Set-Cookie') as string[];
    const tokenCookie = cookies.find((c) => c.startsWith('accessToken='));
    if (tokenCookie) {
      accessToken = tokenCookie.split(';')[0].split('=')[1];
    }
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
    await app.close();
  });

  it('Create a QR code with type "links"', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/qr-codes')
      .set('Cookie', [`accessToken=${accessToken}`])
      .send({
        name: 'Links QR',
        type: 'links',
        data: {
          linksInfo: {
            title: 'My Links',
            themeColor: '#000000',
            avatar:
              'https://res.cloudinary.com/demo/image/upload/qr-thrive/logo/avatar.png',
          },
          linksList: [{ title: 'Portfolio', url: 'https://example.com' }],
        },
        design: {
          dots: { type: 'square', color: '#000000' },
          cornersSquare: { type: 'square', color: '#000000' },
          cornersDot: { type: 'square', color: '#000000' },
          background: { color: '#ffffff' },
          imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 },
          qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'Q' },
        },
        frame: { type: 'none' },
      })
      .expect(201);

    expect(res.body.type).toBe('links');
    expect(res.body.data.linksInfo.avatar).toBe(
      'https://res.cloudinary.com/demo/image/upload/qr-thrive/logo/avatar.png',
    );
  });

  it('Create a QR code with type "coupon"', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/qr-codes')
      .set('Cookie', [`accessToken=${accessToken}`])
      .send({
        name: 'Coupon QR',
        type: 'coupon',
        data: {
          coupon: {
            title: '20% OFF',
            promoCode: 'SAVE20',
            banner:
              'https://res.cloudinary.com/demo/image/upload/qr-thrive/coupon/banner.jpg',
          },
        },
        design: {
          dots: { type: 'square', color: '#000000' },
          cornersSquare: { type: 'square', color: '#000000' },
          cornersDot: { type: 'square', color: '#000000' },
          background: { color: '#ffffff' },
          imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 },
          qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'Q' },
        },
        frame: { type: 'none' },
      })
      .expect(201);

    expect(res.body.type).toBe('coupon');
    expect(res.body.data.coupon.promoCode).toBe('SAVE20');
  });

  it('Delete QR and ensure no errors are thrown in cleanup', async () => {
    // Create a QR with multiple images to trigger cleanup
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/qr-codes')
      .set('Cookie', [`accessToken=${accessToken}`])
      .send({
        name: 'Delete Me',
        type: 'menu',
        data: {
          menu: {
            logo: 'https://res.cloudinary.com/demo/image/upload/qr-thrive/logo/del.png',
            banner:
              'https://res.cloudinary.com/demo/image/upload/qr-thrive/banner/del.jpg',
            categories: [
              {
                items: [
                  {
                    image:
                      'https://res.cloudinary.com/demo/image/upload/qr-thrive/items/del.png',
                  },
                ],
              },
            ],
          },
        },
        design: {
          dots: { type: 'square', color: '#000000' },
          cornersSquare: { type: 'square', color: '#000000' },
          cornersDot: { type: 'square', color: '#000000' },
          background: { color: '#ffffff' },
          imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 },
          qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'Q' },
        },
        frame: { type: 'none' },
      })
      .expect(201);

    const qrId = createRes.body.id;

    await request(app.getHttpServer())
      .delete(`/api/v1/qr-codes/${qrId}`)
      .set('Cookie', [`accessToken=${accessToken}`])
      .expect(200);
  });
});
