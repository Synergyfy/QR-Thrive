import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from '../pricing/pricing.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  private calculatePrices(monthlyPrice: number, quarterlyDiscount: number, yearlyDiscount: number) {
    const quarterly = Number(((monthlyPrice * 3) * (1 - quarterlyDiscount / 100)).toFixed(2));
    const yearly = Number(((monthlyPrice * 12) * (1 - yearlyDiscount / 100)).toFixed(2));
    return { quarterly, yearly };
  }

  private async processPlanPrices(data: any) {
    const config = await this.prisma.systemConfig.findFirst();
    const quarterlyDiscount = config?.quarterlyDiscount || 0;
    const yearlyDiscount = config?.yearlyDiscount || 0;

    const result = { ...data };

    const tiers = [
      { prefix: 'highIncome', field: 'highIncomeMonthlyUSD' },
      { prefix: 'middleIncome', field: 'middleIncomeMonthlyUSD' },
      { prefix: 'lowIncome', field: 'lowIncomeMonthlyUSD' },
    ];

    for (const tier of tiers) {
      const monthly = data[tier.field] || 0;
      const { quarterly, yearly } = this.calculatePrices(monthly, quarterlyDiscount, yearlyDiscount);
      result[`${tier.prefix}QuarterlyUSD`] = quarterly;
      result[`${tier.prefix}YearlyUSD`] = yearly;
    }

    return result;
  }

  async findAll() {
    return this.prisma.plan.findMany({
      where: { deletedAt: null },
      orderBy: { qrCodeLimit: 'asc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });
    if (!plan || plan.deletedAt) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(data: CreatePlanDto) {
    const processedData = await this.processPlanPrices(data);
    return this.prisma.plan.create({
      data: {
        ...processedData,
        isActive: true,
      },
    });
  }

  async update(id: string, data: UpdatePlanDto) {
    const processedData = await this.processPlanPrices(data);
    return this.prisma.plan.update({
      where: { id },
      data: processedData,
    });
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
          isActive: false // Also deactivate so it doesn't show up in any selection
        },
      });
    }

    // Otherwise, perform hard delete
    return this.prisma.plan.delete({
      where: { id },
    });
  }
}
