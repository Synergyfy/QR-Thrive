import { Test, TestingModule } from '@nestjs/testing';
import { PaystackService } from './paystack.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';

describe('PaystackService', () => {
  let service: PaystackService;
  let configService: ConfigService;

  const mockSecretKey = 'sk_test_123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaystackService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'PAYSTACK_SECRET_KEY') return mockSecretKey;
              return null;
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PaystackService>(PaystackService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should correctly verify a valid webhook signature', () => {
    const payload = JSON.stringify({ event: 'charge.success', data: { id: 123 } });
    const signature = crypto
      .createHmac('sha512', mockSecretKey)
      .update(payload)
      .digest('hex');

    expect(service.verifyWebhookSignature(payload, signature)).toBe(true);
  });

  it('should reject an invalid webhook signature', () => {
    const payload = JSON.stringify({ event: 'charge.success' });
    const signature = 'invalid_signature';

    expect(service.verifyWebhookSignature(payload, signature)).toBe(false);
  });
});
