import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT');

    if (publicKey && privateKey && subject) {
      try {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        this.logger.log('Web Push VAPID details configured successfully.');
      } catch (error) {
        this.logger.error(
          `Failed to set VAPID details: ${error.message}. Push notifications will not work.`,
        );
      }
    } else {
      this.logger.warn(
        'VAPID keys are not configured. Push notifications will not work.',
      );
    }
  }

  async saveSubscription(userId: string, subscription: PushSubscriptionDto) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
  }

  async removeSubscription(endpoint: string) {
    try {
      await this.prisma.pushSubscription.delete({
        where: { endpoint },
      });
    } catch (error) {
      // Ignore if already deleted
    }
  }

  async sendPushNotification(userId: string, payload: any) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    const pushPromises = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      return webpush
        .sendNotification(pushSubscription, JSON.stringify(payload))
        .catch(async (error) => {
          if (error.statusCode === 410 || error.statusCode === 404) {
            this.logger.log(`Removing expired subscription: ${sub.endpoint}`);
            await this.removeSubscription(sub.endpoint);
          } else {
            this.logger.error(
              `Error sending push notification: ${error.message}`,
            );
          }
        });
    });

    await Promise.all(pushPromises);
  }
}
