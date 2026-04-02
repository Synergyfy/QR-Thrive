import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as geoip from 'geoip-lite';
import cookieParser from 'cookie-parser';

jest.mock('geoip-lite');

describe('Analytics (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Clean up and create test user
    await prisma.scan.deleteMany();
    await prisma.qRCode.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });

    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword',
      },
    });
    userId = user.id;
    authToken = jwtService.sign({ sub: user.id, email: user.email }, { secret: 'access_secret' });
  });

  afterAll(async () => {
    await prisma.scan.deleteMany();
    await prisma.qRCode.deleteMany();
    if (userId) {
        await prisma.user.deleteMany({ where: { id: userId } });
    }
    await app.close();
  });

  it('should record scan and provide stats with location', async () => {
    // 1. Create a QR Code
    const createRes = await request(app.getHttpServer())
      .post('/qr-codes')
      .set('Cookie', [`accessToken=${authToken}`])
      .send({
        name: 'Analytics Test',
        type: 'url',
        data: { url: 'https://google.com' },
        design: { dots: { type: 'rounded', color: '#000000' }, background: { color: '#ffffff' }, cornersSquare: { type: 'square' }, cornersDot: { type: 'dot' } },
        frame: { type: 'none' },
      })
      .expect(201);

    const qrCode = createRes.body;
    const shortId = qrCode.shortId;

    // 2. Simulate a scan from a specific IP
    const testIp = '8.8.8.8';
    const testUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
    
    (geoip.lookup as jest.Mock).mockReturnValue({
      city: 'Mountain View',
      country: 'US',
      region: 'CA'
    });

    await request(app.getHttpServer())
      .get(`/qr-codes/scan/${shortId}`)
      .set('User-Agent', testUA)
      .set('X-Forwarded-For', testIp)
      .expect(302); // Redirect

    // 3. Check stats
    const statsRes = await request(app.getHttpServer())
      .get('/qr-codes/stats')
      .set('Cookie', [`accessToken=${authToken}`])
      .expect(200);

    expect(statsRes.body.totalScans).toBe(1);
    expect(statsRes.body.uniqueVisitors).toBe(1);
    expect(statsRes.body.deviceDist.mobile).toBe(1);
    expect(statsRes.body.osDist.iOS).toBe(1);
    expect(statsRes.body.browserDist['Mobile Safari']).toBe(1);

    // 4. Check individual QR scan record
    const qrRes = await request(app.getHttpServer())
      .get(`/qr-codes/${qrCode.id}`)
      .set('Cookie', [`accessToken=${authToken}`])
      .expect(200);

    expect(qrRes.body.scans).toHaveLength(1);
    expect(qrRes.body.scans[0].city).toBe('Mountain View');
    expect(qrRes.body.scans[0].country).toBe('US');
    expect(qrRes.body.scans[0].ip).toBe(testIp);
  });
});
