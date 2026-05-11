import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QRCodesService } from './qr-codes.service';
import { QRCodesController } from './qr-codes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FormsModule } from '../forms/forms.module';
import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [
    PrismaModule,
    FormsModule,
    UploadModule,
    NotificationsModule,
    JwtModule.register({}),
    forwardRef(() => IntegrationModule),
  ],
  controllers: [QRCodesController],
  providers: [QRCodesService],
  exports: [QRCodesService],
})
export class QRCodesModule {}
