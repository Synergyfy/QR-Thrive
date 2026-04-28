import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { Role } from '@prisma/client';

describe('Support (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let adminId: string;
  let guestTicketId: string;
  let userTicketId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.use(cookieParser());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Clean up
    await prisma.supportMessage.deleteMany();
    await prisma.typingIndicator.deleteMany();
    await prisma.supportTicket.deleteMany();
    const timestamp = Date.now();
    const userEmail = `support-user-${timestamp}@test.com`;
    const adminEmail = `support-admin-${timestamp}@test.com`;

    // Create User
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        firstName: 'Support',
        lastName: 'User',
        password: 'hashedpassword',
        role: Role.USER,
      },
    });
    userId = user.id;
    const configService = app.get<ConfigService>(ConfigService);
    const jwtSecret = configService.get<string>('JWT_ACCESS_SECRET') || 'access_secret';
    console.log('JWT_SECRET used for signing:', jwtSecret);

    userToken = jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      { secret: jwtSecret, expiresIn: '15m' },
    );

    // Create Admin
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        firstName: 'Support',
        lastName: 'Admin',
        password: 'hashedpassword',
        role: Role.ADMIN,
      },
    });
    adminId = admin.id;
    adminToken = jwtService.sign(
      { sub: admin.id, email: admin.email, role: admin.role },
      { secret: jwtSecret, expiresIn: '15m' },
    );
  });

  afterAll(async () => {
    await prisma.supportMessage.deleteMany();
    await prisma.typingIndicator.deleteMany();
    await prisma.supportTicket.deleteMany();
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    if (adminId) await prisma.user.deleteMany({ where: { id: adminId } });
    await app.close();
  });

  it('1. Create Guest Ticket', async () => {
    const res = await request(app.getHttpServer())
      .post('/support/tickets')
      .send({
        guestName: 'Guest',
        guestEmail: 'guest@guest.com',
        subject: 'Help me as guest',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.guestName).toBe('Guest');
    guestTicketId = res.body.id;
  });

  it('2. Create User Ticket', async () => {
    const res = await request(app.getHttpServer())
      .post('/support/tickets')
      .set('Cookie', [`accessToken=${userToken}`])
      .send({
        subject: 'Help me as user',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.userId).toBe(userId);
    userTicketId = res.body.id;
  });

  it('3. User sends a message', async () => {
    const res = await request(app.getHttpServer())
      .post(`/support/tickets/${userTicketId}/messages`)
      .set('Cookie', [`accessToken=${userToken}`])
      .send({ text: 'Hello admin' })
      .expect(201);

    expect(res.body.text).toBe('Hello admin');
    expect(res.body.sender).toBe('USER');
  });

  it('4. User typing indicator', async () => {
    await request(app.getHttpServer())
      .post(`/support/tickets/${userTicketId}/typing`)
      .set('Cookie', [`accessToken=${userToken}`])
      .expect(201);
  });

  it('5. Admin lists tickets', async () => {
    const res = await request(app.getHttpServer())
      .get('/support/tickets')
      .set('Cookie', [`accessToken=${adminToken}`])
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('6. Admin gets ticket messages', async () => {
    const res = await request(app.getHttpServer())
      .get(`/support/tickets/${userTicketId}/messages`)
      .set('Cookie', [`accessToken=${adminToken}`])
      .expect(200);

    expect(res.body.messages.length).toBe(1);
    expect(res.body.messages[0].text).toBe('Hello admin');
  });

  it('7. Admin replies to ticket', async () => {
    const res = await request(app.getHttpServer())
      .post(`/support/tickets/${userTicketId}/messages`)
      .set('Cookie', [`accessToken=${adminToken}`])
      .send({ text: 'Hello user' })
      .expect(201);

    expect(res.body.text).toBe('Hello user');
    expect(res.body.sender).toBe('ADMIN');
  });

  it('8. User polls myTicket (read receipt updates)', async () => {
    const res = await request(app.getHttpServer())
      .get('/support/tickets/mine')
      .set('Cookie', [`accessToken=${userToken}`])
      .expect(200);

    expect(res.body.ticket.id).toBe(userTicketId);
    expect(res.body.messages.length).toBe(2);
    // User getting messages should update admin's message readAt
    const adminMsg = res.body.messages.find(m => m.sender === 'ADMIN');
    expect(adminMsg.readAt).not.toBeNull();
  });

  it('9. Update ticket status as admin', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/support/tickets/${userTicketId}/status`)
      .set('Cookie', [`accessToken=${adminToken}`])
      .send({ status: 'RESOLVED' })
      .expect(200);

    expect(res.body.status).toBe('RESOLVED');
  });
});
