import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from '../pricing/pricing.dto';
import { PricingTier, BillingCycle, PriceStatus } from '@prisma/client';
import { PricingService } from './pricing.service';

@Injectable()
export class PlansService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
  ) {}

  private async ensureSingleDefault(isDefault: boolean) {
    if (isDefault) {
      await this.prisma.plan.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
  }

  async findAll() {
    return this.prisma.plan.findMany({
      where: { deletedAt: null },
      include: {
        priceBooks: true,
      },
      orderBy: { qrCodeLimit: 'asc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        priceBooks: true,
      },
    });
    if (!plan || plan.deletedAt) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(data: CreatePlanDto) {
    if (data.isDefault) await this.ensureSingleDefault(true);

    const { highTierPrice, middleTierPrice, lowTierPrice, ...planData } = data;

    const priceBooksToCreate: any[] = [];

    const addTierPrices = async (tier: PricingTier, monthlyPrice: number) => {
      const prices = await this.pricingService.calculateDiscountedPrices(
        monthlyPrice,
        'USD',
      );

      priceBooksToCreate.push({
        tier,
        currencyCode: 'USD',
        billingCycle: BillingCycle.MONTHLY,
        price: prices.monthly,
        status: PriceStatus.ACTIVE,
      });

      priceBooksToCreate.push({
        tier,
        currencyCode: 'USD',
        billingCycle: BillingCycle.QUARTERLY,
        price: prices.quarterly,
        status: PriceStatus.ACTIVE,
      });

      priceBooksToCreate.push({
        tier,
        currencyCode: 'USD',
        billingCycle: BillingCycle.YEARLY,
        price: prices.yearly,
        status: PriceStatus.ACTIVE,
      });
    };

    if (highTierPrice !== undefined)
      await addTierPrices(PricingTier.HIGH, highTierPrice);
    if (middleTierPrice !== undefined)
      await addTierPrices(PricingTier.MIDDLE, middleTierPrice);
    if (lowTierPrice !== undefined)
      await addTierPrices(PricingTier.LOW, lowTierPrice);

    const plan = await this.prisma.plan.create({
      data: {
        ...planData,
        isActive: true,
        priceBooks:
          priceBooksToCreate.length > 0
            ? {
                create: priceBooksToCreate,
              }
            : undefined,
      },
      include: {
        priceBooks: true,
      },
    });

    // Invalidate initial cache if any (though usually not needed for brand new plan)
    return plan;
  }

  async update(id: string, data: UpdatePlanDto) {
    if (data.isDefault) await this.ensureSingleDefault(true);

    // Destructure out tier prices just in case they are sent during an update
    // (though usually handled via PriceBook endpoints now)
    const { highTierPrice, middleTierPrice, lowTierPrice, ...planData } =
      data as any;

    const updated = await this.prisma.plan.update({
      where: { id },
      data: planData,
      include: {
        priceBooks: true,
      },
    });

    await this.pricingService.clearPricingCache();

    return updated;
  }

  async delete(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    // If plan has subscribers, soft delete it
    if (plan._count.users > 0) {
      return this.prisma.plan.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false, // Also deactivate so it doesn't show up in any selection
        },
      });
    }

    // Otherwise, perform hard delete
    return this.prisma.plan.delete({
      where: { id },
    });
  }
}
