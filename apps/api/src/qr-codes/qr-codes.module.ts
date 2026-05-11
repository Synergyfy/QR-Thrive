import { Module, forwardRef } from '@nestjs/common';
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
    forwardRef(() => IntegrationModule),
  ],
  controllers: [QRCodesController],
  providers: [QRCodesService],
  exports: [QRCodesService],
})
export class QRCodesModule {}
