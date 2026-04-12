import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PaymentsModule } from '../payments/payments.module';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [PaymentsModule, IntegrationModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
