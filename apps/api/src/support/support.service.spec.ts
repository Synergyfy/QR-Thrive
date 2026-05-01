import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TicketStatus, MessageSender } from '@prisma/client';

const mockPrismaService = {
  supportTicket: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  supportMessage: {
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  typingIndicator: {
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
  },
};

describe('SupportService', () => {
  let service: SupportService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTicket', () => {
    it('should create a guest ticket when no userId is provided', async () => {
      const dto = { guestName: 'Guest', guestEmail: 'guest@test.com', subject: 'Help' };
      mockPrismaService.supportTicket.create.mockResolvedValue({ id: 'ticket-1', ...dto });

      const result = await service.createTicket(dto);

      expect(prisma.supportTicket.create).toHaveBeenCalledWith({
        data: { guestName: 'Guest', guestEmail: 'guest@test.com', subject: 'Help' },
      });
      expect(result.id).toEqual('ticket-1');
    });

    it('should return existing open ticket if user already has one', async () => {
      const existingTicket = { id: 'ticket-2', userId: 'user-1' };
      mockPrismaService.supportTicket.findFirst.mockResolvedValue(existingTicket);

      const result = await service.createTicket({ subject: 'New Help' }, 'user-1');

      expect(prisma.supportTicket.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } },
      });
      expect(prisma.supportTicket.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingTicket);
    });
  });

  describe('sendMessage', () => {
    it('should throw NotFoundException if ticket not found', async () => {
      mockPrismaService.supportTicket.findUnique.mockResolvedValue(null);

      await expect(service.sendMessage('invalid-id', MessageSender.USER, 'Hello'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user tries to send to another users ticket', async () => {
      mockPrismaService.supportTicket.findUnique.mockResolvedValue({ id: 't-1', userId: 'user-2' });

      await expect(service.sendMessage('t-1', MessageSender.USER, 'Hello', 'user-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should create message and clear typing indicator', async () => {
      mockPrismaService.supportTicket.findUnique.mockResolvedValue({ id: 't-1', userId: 'user-1' });
      mockPrismaService.supportMessage.create.mockResolvedValue({ id: 'm-1' });

      await service.sendMessage('t-1', MessageSender.USER, 'Hello', 'user-1');

      expect(prisma.typingIndicator.deleteMany).toHaveBeenCalledWith({
        where: { ticketId: 't-1', sender: MessageSender.USER },
      });
      expect(prisma.supportMessage.create).toHaveBeenCalledWith({
        data: { ticketId: 't-1', sender: MessageSender.USER, text: 'Hello' },
      });
    });
  });

  describe('getMyTicket', () => {
    it('should mark admin messages as read', async () => {
      const ticket = {
        id: 't-1',
        messages: [
          { id: 'm-1', sender: MessageSender.ADMIN, readAt: null },
          { id: 'm-2', sender: MessageSender.USER, readAt: null },
        ]
      };
      mockPrismaService.supportTicket.findFirst.mockResolvedValue(ticket);

      await service.getMyTicket('user-1');

      expect(prisma.supportMessage.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: { in: ['m-1'] } },
      }));
    });
    
    it('should correctly evaluate if other side is typing', async () => {
      const ticket = { id: 't-1', messages: [] };
      mockPrismaService.supportTicket.findFirst.mockResolvedValue(ticket);
      mockPrismaService.typingIndicator.findUnique.mockResolvedValue({
        updatedAt: new Date(), // Just updated
      });

      const res = await service.getMyTicket('user-1');
      expect(res?.isOtherSideTyping).toBe(true);
    });
    
    it('should handle expired typing indicator', async () => {
      const ticket = { id: 't-1', messages: [] };
      mockPrismaService.supportTicket.findFirst.mockResolvedValue(ticket);
      mockPrismaService.typingIndicator.findUnique.mockResolvedValue({
        updatedAt: new Date(Date.now() - 10000), // 10s ago, expired
      });

      const res = await service.getMyTicket('user-1');
      expect(res?.isOtherSideTyping).toBe(false);
    });
  });
});
