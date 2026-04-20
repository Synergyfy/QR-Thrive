import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { VemtapService } from './vemtap.service';
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
  ],
  controllers: [IntegrationController],
  providers: [IntegrationService, VemtapService],
  exports: [VemtapService],
})
export class IntegrationModule {}
