import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';

describe('Forms (e2e)', () => {
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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.use(cookieParser());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Clean up
    await prisma.formSubmission.deleteMany();
    await prisma.formField.deleteMany();
    await prisma.form.deleteMany();
    await prisma.qRCode.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'form-test@example.com' } });

    const user = await prisma.user.create({
      data: {
        email: 'form-test@example.com',
        firstName: 'Form',
        lastName: 'Tester',
        password: 'hashedpassword',
      },
    });
    userId = user.id;
    // secret matches what's in analytics.e2e-spec.ts or default
    authToken = jwtService.sign(
      { sub: user.id, email: user.email },
      { secret: 'access_secret' },
    );
  });

  afterAll(async () => {
    await prisma.formSubmission.deleteMany();
    await prisma.formField.deleteMany();
    await prisma.form.deleteMany();
    await prisma.qRCode.deleteMany();
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await app.close();
  });

  it('should create a form QR, configure fields, and submit answers', async () => {
    try {
      console.log('Step 1: Creating QR Code...');
      const qrRes = await request(app.getHttpServer())
        .post('/qr-codes')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          name: 'My Custom Form',
          type: 'form',
          data: {},
          design: {
            dots: { type: 'rounded', color: '#000000' },
            background: { color: '#ffffff' },
            cornersSquare: { type: 'square' },
            cornersDot: { type: 'dot' },
          },
          frame: { type: 'none' },
        });

      if (qrRes.status !== 201) {
        console.error('QR creation failed:', qrRes.body);
        throw new Error(`Failed to create QR code: ${qrRes.status}`);
      }

      const qrCodeId = qrRes.body.id;
      const shortId = qrRes.body.shortId;
      console.log('Step 1 finished. qrCodeId:', qrCodeId);

      // 2. Configure Form Fields
      console.log('Step 2: Configuring form fields...');
      const formRes = await request(app.getHttpServer())
        .post('/forms')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          qrCodeId,
          title: 'Feedback Form',
          description: 'Please let us know your thoughts',
          fields: [
            { type: 'text', label: 'Name', required: true, order: 0 },
            { type: 'email', label: 'Email', required: true, order: 1 },
            { type: 'number', label: 'Age', required: false, order: 2 },
            {
              type: 'select',
              label: 'Satisfaction',
              required: true,
              options: [
                { label: 'High', value: 'high' },
                { label: 'Low', value: 'low' },
              ],
              order: 3,
            },
          ],
        });

      if (formRes.status !== 201) {
        console.error('Form config failed:', formRes.body);
        throw new Error(`Failed to configure form: ${formRes.status}`);
      }

      expect(formRes.body.fields).toHaveLength(4);
      const fields = formRes.body.fields;
      const nameField = fields.find((f) => f.label === 'Name');
      const emailField = fields.find((f) => f.label === 'Email');
      const ageField = fields.find((f) => f.label === 'Age');
      const satField = fields.find((f) => f.label === 'Satisfaction');
      console.log('Step 2 finished.');

      // 3. Get Public Form
      console.log('Step 3: Getting public form...');
      const publicRes = await request(app.getHttpServer())
        .get(`/public/forms/${shortId}`)
        .expect(200);

      expect(publicRes.body.title).toBe('Feedback Form');
      expect(publicRes.body.fields).toHaveLength(4);
      console.log('Step 3 finished.');

      // 4. Submit Form (Fail validation - missing required Email)
      console.log('Step 4: Submitting with missing required...');
      await request(app.getHttpServer())
        .post(`/public/forms/${shortId}/submit`)
        .send({
          answers: {
            [nameField.id]: 'John Doe',
            [satField.id]: 'high',
          },
        })
        .expect(400);
      console.log('Step 4 finished.');

      // 5. Submit Form (Success)
      console.log('Step 5: Submitting success...');
      const submitRes = await request(app.getHttpServer())
        .post(`/public/forms/${shortId}/submit`)
        .send({
          answers: {
            [nameField.id]: 'John Doe',
            [emailField.id]: 'john@example.com',
            [satField.id]: 'high',
            [ageField.id]: 30,
          },
        })
        .expect(201);

      expect(submitRes.body.id).toBeDefined();
      console.log('Step 5 finished.');

      // 6. Get Submissions (Owner only)
      console.log('Step 6: Getting submissions...');
      const subsRes = await request(app.getHttpServer())
        .get(`/forms/${qrCodeId}/submissions`)
        .set('Cookie', [`accessToken=${authToken}`])
        .expect(200);

      expect(subsRes.body).toHaveLength(1);
      expect(subsRes.body[0].answers[nameField.id]).toBe('John Doe');
      console.log('Step 6 finished.');
    } catch (error) {
      console.error('Test Error:', error);
      throw error;
    }
  });
});
