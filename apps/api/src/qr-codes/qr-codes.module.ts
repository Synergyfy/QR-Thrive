import { Module } from '@nestjs/common';
import { QRCodesService } from './qr-codes.service';
import { QRCodesController } from './qr-codes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FormsModule } from '../forms/forms.module';

@Module({
  imports: [PrismaModule, FormsModule],
  controllers: [QRCodesController],
  providers: [QRCodesService],
})
export class QRCodesModule {}
