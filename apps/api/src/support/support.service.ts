import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus, MessageSender } from '@prisma/client';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SupportGateway } from './support.gateway';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supportGateway: SupportGateway,
  ) {}

  async createTicket(data: CreateTicketDto, userId?: string) {
    if (userId) {
      // Find if there's an existing open ticket for this user
      const existingTicket = await this.prisma.supportTicket.findFirst({
        where: {
          userId,
          status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] },
        },
      });

      if (existingTicket) {
        return existingTicket;
      }

      return this.prisma.supportTicket.create({
        data: {
          userId,
          subject: data.subject || 'Support Request',
        },
      });
    }

    // Guest ticket
    return this.prisma.supportTicket.create({
      data: {
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        subject: data.subject || 'Support Request',
      },
    });
  }

  async getMyTicket(userId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: {
        userId,
        status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!ticket) return null;

    // Mark admin messages as read by user
    const unreadAdminMessageIds = ticket.messages
      .filter((m) => m.sender === MessageSender.ADMIN && !m.readAt)
      .map((m) => m.id);

    if (unreadAdminMessageIds.length > 0) {
      const now = new Date();
      await this.prisma.supportMessage.updateMany({
        where: { id: { in: unreadAdminMessageIds } },
        data: { readAt: now },
      });
      ticket.messages.forEach((m) => {
        if (unreadAdminMessageIds.includes(m.id)) {
          m.readAt = now;
        }
      });
    }

    // Check typing indicator for admin
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const typingIndicator = await this.prisma.typingIndicator.findUnique({
      where: {
        ticketId_sender: {
          ticketId: ticket.id,
          sender: MessageSender.ADMIN,
        },
      },
    });

    const isOtherSideTyping = !!(typingIndicator && typingIndicator.updatedAt > fiveSecondsAgo);

    return {
      ticket: {
        id: ticket.id,
        userId: ticket.userId,
        guestName: ticket.guestName,
        guestEmail: ticket.guestEmail,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
      messages: ticket.messages,
      isOtherSideTyping,
    };
  }

  async sendMessage(ticketId: string, sender: MessageSender, text: string, requestingUserId?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (sender === MessageSender.USER) {
      // Must be owner or guest ticket (if guest, they don't have token but we should allow if they just created it,
      // but standard is users can only send if they own it)
      if (ticket.userId && ticket.userId !== requestingUserId) {
        throw new ForbiddenException('Not your ticket');
      }
    }

    // Clear typing indicator for sender
    await this.prisma.typingIndicator.deleteMany({
      where: {
        ticketId,
        sender,
      },
    });

    const message = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        sender,
        text,
      },
    });

    // Broadcast via WebSocket
    this.supportGateway.broadcastNewMessage(ticketId, message);

    return message;
  }

  async upsertTypingIndicator(ticketId: string, sender: MessageSender) {
    return this.prisma.typingIndicator.upsert({
      where: {
        ticketId_sender: {
          ticketId,
          sender,
        },
      },
      create: {
        ticketId,
        sender,
      },
      update: {
        updatedAt: new Date(),
      },
    });
  }

  // --- ADMIN FUNCTIONS ---

  async getTickets(page: number, limit: number, search: string, status?: string) {
    const where: any = {};
    if (status) {
      where.status = status as TicketStatus;
    }
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { guestName: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, createdAt: true, avatar: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Get last message
          },
          _count: {
            select: {
              messages: {
                where: { sender: MessageSender.USER, readAt: null },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data: tickets.map(t => ({
        ...t,
        unreadCount: t._count.messages,
        lastMessage: t.messages[0],
        _count: undefined,
        messages: undefined,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTicketMessages(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, createdAt: true, avatar: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    // Mark user messages as read by admin
    const unreadUserMessageIds = ticket.messages
      .filter((m) => m.sender === MessageSender.USER && !m.readAt)
      .map((m) => m.id);

    if (unreadUserMessageIds.length > 0) {
      const now = new Date();
      await this.prisma.supportMessage.updateMany({
        where: { id: { in: unreadUserMessageIds } },
        data: { readAt: now },
      });
      ticket.messages.forEach((m) => {
        if (unreadUserMessageIds.includes(m.id)) {
          m.readAt = now;
        }
      });
    }

    // Check typing indicator for user
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const typingIndicator = await this.prisma.typingIndicator.findUnique({
      where: {
        ticketId_sender: {
          ticketId: ticket.id,
          sender: MessageSender.USER,
        },
      },
    });

    const isOtherSideTyping = !!(typingIndicator && typingIndicator.updatedAt > fiveSecondsAgo);

    return {
      ticket: {
        id: ticket.id,
        userId: ticket.userId,
        guestName: ticket.guestName,
        guestEmail: ticket.guestEmail,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        user: ticket.user,
      },
      messages: ticket.messages,
      isOtherSideTyping,
    };
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus) {
    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });
    this.supportGateway.broadcastStatusUpdate(ticketId, status);
    return updated;
  }
}
