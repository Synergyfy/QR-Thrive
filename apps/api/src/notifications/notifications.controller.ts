import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PushService } from './push.service';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications/push')
export class NotificationsController {
  constructor(private readonly pushService: PushService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  async subscribe(@Req() req, @Body() subscription: PushSubscriptionDto) {
    const userId = req.user.userId;
    await this.pushService.saveSubscription(userId, subscription);
    return { message: 'Subscription saved successfully' };
  }

  @Delete('unsubscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  async unsubscribe(@Body('endpoint') endpoint: string) {
    await this.pushService.removeSubscription(endpoint);
  }
}
