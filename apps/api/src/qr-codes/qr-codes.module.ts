import { Module } from '@nestjs/common';
import { QRCodesService } from './qr-codes.service';
import { QRCodesController } from './qr-codes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FormsModule } from '../forms/forms.module';
import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, FormsModule, UploadModule, NotificationsModule],
  controllers: [QRCodesController],
  providers: [QRCodesService],
  exports: [QRCodesService],
})
export class QRCodesModule {}
