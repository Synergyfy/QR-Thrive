import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto, SetPlanPriceDto } from '../pricing/pricing.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.plan.findMany({
      include: { prices: { include: { tier: true } } },
      orderBy: { qrCodeLimit: 'asc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: { prices: { include: { tier: true } } },
    });
    if (!plan) throw new NotFoundException('Plan not found');
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
    return this.prisma.plan.delete({ where: { id } });
  }

  async setPrice(planId: string, data: SetPlanPriceDto) {
    return this.prisma.planPrice.upsert({
      where: {
        planId_tierId: {
          planId,
          tierId: data.tierId,
        },
      },
      update: {
        monthlyPriceUSD: data.monthlyPriceUSD,
      },
      create: {
        planId,
        tierId: data.tierId,
        monthlyPriceUSD: data.monthlyPriceUSD,
      },
    });
  }
}
