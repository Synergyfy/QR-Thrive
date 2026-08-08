import { Module, forwardRef } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PlansService } from './plans.service';
import { PricingController } from './pricing.controller';
import { PlansController } from './plans.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UsageGuard } from './usage.guard';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
    ConfigModule,
    forwardRef(() => IntegrationModule),
  ],
  controllers: [PricingController, PlansController],
  providers: [PricingService, PlansService, UsageGuard],
  exports: [PricingService, PlansService, UsageGuard],
})
export class PricingModule {}
