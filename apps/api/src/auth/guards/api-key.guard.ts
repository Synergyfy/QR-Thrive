import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('API key is missing');
    }

    const internalKey = this.configService.get<string>('INTERNAL_API_KEY');

    if (!internalKey) {
      throw new UnauthorizedException('Internal API key not configured on server');
    }

    if (apiKey !== internalKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
