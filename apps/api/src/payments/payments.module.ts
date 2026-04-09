import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PaystackService } from './paystack.service';
import { PaymentsController } from './payments.controller';

import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [HttpModule, ConfigModule, PricingModule],
  providers: [PaystackService],
  controllers: [PaymentsController],
  exports: [PaystackService],
})
export class PaymentsModule {}
