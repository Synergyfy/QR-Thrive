import { Module } from '@nestjs/common';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { QRCodesModule } from '../qr-codes/qr-codes.module';
import { AuthModule } from '../auth/auth.module';
import { FormsModule } from '../forms/forms.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, QRCodesModule, AuthModule, FormsModule],
  controllers: [IntegrationController],
  providers: [IntegrationService],
})
export class IntegrationModule {}
