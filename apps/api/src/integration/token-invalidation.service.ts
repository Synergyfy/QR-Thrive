import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TokenInvalidationService {
  private readonly logger = new Logger(TokenInvalidationService.name);
  private readonly invalidatedTokens = new Map<string, number>();
  private readonly TOKEN_TTL_MS = 60 * 60 * 1000;

  invalidateToken(tokenId: string): void {
    const expiry = Date.now() + this.TOKEN_TTL_MS;
    this.invalidatedTokens.set(tokenId, expiry);
    this.logger.debug(`Token invalidated: ${tokenId.substring(0, 8)}...`);
  }

  isValid(tokenId: string): boolean {
    const expiry = this.invalidatedTokens.get(tokenId);

    if (!expiry) {
      return true;
    }

    if (Date.now() > expiry) {
      this.invalidatedTokens.delete(tokenId);
      return true;
    }

    return false;
  }

  isValidFromToken(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const tokenId = `${payload.sub}-${payload.businessId}-${payload.iat}`;
      return this.isValid(tokenId);
    } catch {
      return false;
    }
  }

  invalidateFromToken(token: string): void {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return;
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const tokenId = `${payload.sub}-${payload.businessId}-${payload.iat}`;
      this.invalidateToken(tokenId);
    } catch {
      this.logger.warn('Failed to parse token for invalidation');
    }
  }

  cleanExpiredTokens(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [tokenId, expiry] of this.invalidatedTokens.entries()) {
      if (now > expiry) {
        this.invalidatedTokens.delete(tokenId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired invalidated tokens`);
    }

    return cleaned;
  }
}