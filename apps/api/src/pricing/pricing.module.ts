import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PlansService } from './plans.service';
import { PricingController } from './pricing.controller';
import { PlansController } from './plans.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, JwtModule.register({}), ConfigModule],
  controllers: [PricingController, PlansController],
  providers: [PricingService, PlansService],
  exports: [PricingService, PlansService],
})
export class PricingModule {}
