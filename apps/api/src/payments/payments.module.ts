import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PaystackService } from './paystack.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [PaystackService],
  controllers: [PaymentsController],
  exports: [PaystackService],
})
export class PaymentsModule {}
