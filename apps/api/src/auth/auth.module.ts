import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PricingModule } from '../pricing/pricing.module';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [PrismaModule, ConfigModule, PassportModule, JwtModule.register({}), PricingModule, forwardRef(() => IntegrationModule)],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
