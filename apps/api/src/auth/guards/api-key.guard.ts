import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('API key is missing');
    }

    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    const keyEntry = await this.prisma.apiKey.findUnique({
      where: { key: hashedKey },
    });

    if (!keyEntry || !keyEntry.isActive) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    return true;
  }
}
