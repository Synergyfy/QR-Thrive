import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto, SetPlanPriceDto } from '../pricing/pricing.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.plan.findMany({
      where: { deletedAt: null },
      include: { prices: { include: { tier: true } } },
      orderBy: { qrCodeLimit: 'asc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: { prices: { include: { tier: true } } },
    });
    if (!plan || plan.deletedAt) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(data: CreatePlanDto) {
    return this.prisma.plan.create({
      data: {
        ...data,
        isActive: true,
      },
    });
  }

  async update(id: string, data: UpdatePlanDto) {
    return this.prisma.plan.update({
      where: { id },
      data,
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

  async setPrice(planId: string, data: SetPlanPriceDto) {
    const config = await this.prisma.systemConfig.findFirst();
    const quarterlyDiscount = config?.quarterlyDiscount || 0;
    const yearlyDiscount = config?.yearlyDiscount || 0;

    const quarterlyPriceUSD = Number(((data.monthlyPriceUSD * 3) * (1 - quarterlyDiscount / 100)).toFixed(2));
    const yearlyPriceUSD = Number(((data.monthlyPriceUSD * 12) * (1 - yearlyDiscount / 100)).toFixed(2));

    return this.prisma.planPrice.upsert({
      where: {
        planId_tierId: {
          planId,
          tierId: data.tierId,
        },
      },
      update: {
        monthlyPriceUSD: data.monthlyPriceUSD,
        quarterlyPriceUSD,
        yearlyPriceUSD,
      },
      create: {
        planId,
        tierId: data.tierId,
        monthlyPriceUSD: data.monthlyPriceUSD,
        quarterlyPriceUSD,
        yearlyPriceUSD,
      },
    });
  }
}
