import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, ParseIntPipe, Req } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MessageSender, Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@ApiTags('Support')
@Controller('support')
@UseGuards(RolesGuard)
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('tickets')
  @ApiOperation({ summary: 'Create a new support ticket (User or Guest)' })
  async createTicket(@Body() createTicketDto: CreateTicketDto, @Req() req: any) {
    let userId = req.user?.userId;
    if (!userId && req.cookies?.['accessToken']) {
      try {
        const payload = await this.jwtService.verifyAsync(req.cookies['accessToken'], {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'access_secret',
        });
        userId = payload.sub;
      } catch (e) {
        // Ignored, treat as guest
      }
    }
    return this.supportService.createTicket(createTicketDto, userId);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('tickets/mine')
  @ApiOperation({ summary: 'Get current users open ticket and messages' })
  getMyTicket(@Req() req: any) {
    return this.supportService.getMyTicket(req.user.userId);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Send a message in a ticket' })
  sendMessage(
    @Param('id') id: string,
    @Body() sendMessageDto: SendMessageDto,
    @Req() req: any,
  ) {
    // Determine sender based on role. If admin, send as ADMIN, else USER.
    // Note: Admins can act as users if they use the frontend, but typically admin requests hit this from admin panel.
    // We will assume if they have ADMIN role, they are replying as ADMIN.
    const isAdmin = req.user.role === Role.ADMIN;
    
    // BUT an admin might be testing the floating chat.
    // To be safe, if the request comes to /support/tickets/:id/messages, we can check if it's an admin context.
    // Let's pass the role, and the service will validate.
    // Actually, let's just let the frontend specify if it's an admin reply or not? No, securely determine from role.
    // The floating chat will send messages as USER. The admin chat will send as ADMIN.
    // To distinguish, we can check if the route is hit with admin intent or just by role.
    // For simplicity: if they are ADMIN, send as ADMIN.
    const sender = isAdmin ? MessageSender.ADMIN : MessageSender.USER;
    
    return this.supportService.sendMessage(id, sender, sendMessageDto.text, req.user.userId);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('tickets/:id/typing')
  @ApiOperation({ summary: 'Send typing indicator signal' })
  sendTypingSignal(@Param('id') id: string, @Req() req: any) {
    const sender = req.user.role === Role.ADMIN ? MessageSender.ADMIN : MessageSender.USER;
    return this.supportService.upsertTypingIndicator(id, sender);
  }

  // --- ADMIN ROUTES ---

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Get('tickets')
  @ApiOperation({ summary: 'List all tickets (Admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  getTickets(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('search') search = '',
    @Query('status') status?: string,
  ) {
    return this.supportService.getTickets(page, limit, search, status);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Get('tickets/:id/messages')
  @ApiOperation({ summary: 'Get all messages for a ticket (Admin)' })
  getTicketMessages(@Param('id') id: string) {
    return this.supportService.getTicketMessages(id);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Update ticket status (Admin)' })
  updateTicketStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTicketStatusDto,
  ) {
    return this.supportService.updateTicketStatus(id, updateStatusDto.status);
  }
}
