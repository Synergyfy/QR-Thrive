import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { VemtapService } from './vemtap.service';
import { VemtapAuthService } from './vemtap-auth.service';
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
  ],
  controllers: [IntegrationController],
  providers: [IntegrationService, VemtapService, VemtapAuthService],
  exports: [VemtapService, VemtapAuthService],
})
export class IntegrationModule {}
