import { Test, TestingModule } from '@nestjs/testing';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const mockSupportService = {
  createTicket: jest.fn(),
  sendMessage: jest.fn(),
  getMyTicket: jest.fn(),
  updateTypingIndicator: jest.fn(),
  getTickets: jest.fn(),
  getTicketMessages: jest.fn(),
  updateTicketStatus: jest.fn(),
};

describe('SupportController', () => {
  let controller: SupportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        {
          provide: SupportService,
          useValue: mockSupportService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SupportController>(SupportController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTicket', () => {
    it('should call service with dto and user id if provided', async () => {
      const req = { user: { id: 'u-1' } };
      const dto = { subject: 'Help' };
      await controller.createTicket(dto, req);
      expect(mockSupportService.createTicket).toHaveBeenCalledWith(dto, 'u-1');
    });
    
    it('should call service with dto and no user id if not logged in', async () => {
      const req = {};
      const dto = { guestName: 'G', guestEmail: 'g@test.com', subject: 'Help' };
      await controller.createTicket(dto, req);
      expect(mockSupportService.createTicket).toHaveBeenCalledWith(dto, undefined);
    });
  });

  describe('Admin Endpoints', () => {
    it('should call getTickets with query params', async () => {
      await controller.getTickets(1, 10, 'search', 'OPEN');
      expect(mockSupportService.getTickets).toHaveBeenCalledWith(1, 10, 'search', 'OPEN');
    });

    it('should update ticket status', async () => {
      const dto = { status: 'RESOLVED' as any };
      await controller.updateTicketStatus('t-1', dto);
      expect(mockSupportService.updateTicketStatus).toHaveBeenCalledWith('t-1', 'RESOLVED');
    });
  });
});
