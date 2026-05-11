import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { VemtapService } from './vemtap.service';
import { VemtapAuthService } from './vemtap-auth.service';
import { CapabilityService } from './capability.service';
import { TokenInvalidationService } from './token-invalidation.service';
import { VemTapSubscriptionGuard } from './vemtap-subscription.guard';
import { QRCodesModule } from '../qr-codes/qr-codes.module';
import { AuthModule } from '../auth/auth.module';
import { FormsModule } from '../forms/forms.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    QRCodesModule,
    forwardRef(() => AuthModule),
    FormsModule,
    HttpModule,
    JwtModule.register({}),
    ConfigModule,
  ],
  controllers: [IntegrationController],
  providers: [
    IntegrationService,
    VemtapService,
    VemtapAuthService,
    CapabilityService,
    TokenInvalidationService,
    VemTapSubscriptionGuard,
  ],
  exports: [VemtapService, VemtapAuthService, CapabilityService, TokenInvalidationService, VemTapSubscriptionGuard],
})
export class IntegrationModule {}
