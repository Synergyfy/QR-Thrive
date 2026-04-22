import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let pushService: PushService;

  const mockPushService = {
    saveSubscription: jest.fn(),
    removeSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: PushService,
          useValue: mockPushService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
    pushService = module.get<PushService>(PushService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('subscribe', () => {
    it('should call pushService.saveSubscription with correct userId', async () => {
      const req = { user: { userId: 'user-123' } };
      const dto = {
        endpoint: 'https://test.com',
        keys: { p256dh: 'dh', auth: 'auth' },
      };

      await controller.subscribe(req, dto);

      expect(pushService.saveSubscription).toHaveBeenCalledWith('user-123', dto);
    });
  });

  describe('unsubscribe', () => {
    it('should call pushService.removeSubscription', async () => {
      const endpoint = 'https://test.com';
      await controller.unsubscribe(endpoint);
      expect(pushService.removeSubscription).toHaveBeenCalledWith(endpoint);
    });
  });
});
