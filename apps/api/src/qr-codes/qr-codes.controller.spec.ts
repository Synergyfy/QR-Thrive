import { Test, TestingModule } from '@nestjs/testing';
import { QRCodesController } from './qr-codes.controller';
import { QRCodesService } from './qr-codes.service';
import { QRType } from '@prisma/client';

describe('QRCodesController', () => {
  let controller: QRCodesController;
  let service: QRCodesService;

  const mockQRCodesService = {
    create: jest.fn((userId, dto) => {
      return { id: 'some-id', userId, shortId: 'abcd', ...dto };
    }),
    findAll: jest.fn((userId) => {
      return [{ id: 'some-id', userId }];
    }),
    findByShortId: jest.fn((shortId) => {
      return { id: 'some-id', shortId };
    }),
    findOne: jest.fn((id, userId) => {
      return { id, userId };
    }),
    update: jest.fn((id, userId, dto) => {
      return { id, userId, ...dto };
    }),
    remove: jest.fn((id, userId) => {
      return { id, userId, deleted: true };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QRCodesController],
      providers: [
        {
          provide: QRCodesService,
          useValue: mockQRCodesService,
        },
      ],
    }).compile();

    controller = module.get<QRCodesController>(QRCodesController);
    service = module.get<QRCodesService>(QRCodesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a qr code', async () => {
    const req = { user: { userId: 'user-1' } } as any;
    const dto = {
      name: 'Test QR',
      type: QRType.url,
      data: { url: 'http://test.com' },
      design: {},
      frame: {},
    };
    expect(await controller.create(req, dto)).toEqual({
      id: 'some-id',
      userId: 'user-1',
      shortId: 'abcd',
      ...dto,
    });
    expect(service.create).toHaveBeenCalledWith('user-1', dto);
  });
});
