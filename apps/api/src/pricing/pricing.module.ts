import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PlansService } from './plans.service';
import { PricingController } from './pricing.controller';
import { PlansController } from './plans.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PricingController, PlansController],
  providers: [PricingService, PlansService],
  exports: [PricingService, PlansService],
})
export class PricingModule {}
