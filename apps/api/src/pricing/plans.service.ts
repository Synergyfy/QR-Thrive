import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from '../pricing/pricing.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

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
        priceBooks: true
      },
      orderBy: { qrCodeLimit: 'asc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        priceBooks: true
      }
    });
    if (!plan || plan.deletedAt) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(data: CreatePlanDto) {
    if (data.isDefault) await this.ensureSingleDefault(true);
    
    const { highTierPrice, middleTierPrice, lowTierPrice, ...planData } = data;

    const priceBooksToCreate = [];
    if (highTierPrice !== undefined) {
      priceBooksToCreate.push({ tier: 'HIGH' as const, currencyCode: 'USD', billingCycle: 'MONTHLY' as const, price: highTierPrice, status: 'ACTIVE' as const });
    }
    if (middleTierPrice !== undefined) {
      priceBooksToCreate.push({ tier: 'MIDDLE' as const, currencyCode: 'USD', billingCycle: 'MONTHLY' as const, price: middleTierPrice, status: 'ACTIVE' as const });
    }
    if (lowTierPrice !== undefined) {
      priceBooksToCreate.push({ tier: 'LOW' as const, currencyCode: 'USD', billingCycle: 'MONTHLY' as const, price: lowTierPrice, status: 'ACTIVE' as const });
    }

    return this.prisma.plan.create({
      data: {
        ...planData,
        isActive: true,
        priceBooks: priceBooksToCreate.length > 0 ? {
          create: priceBooksToCreate
        } : undefined,
      },
      include: {
        priceBooks: true
      }
    });
  }

  async update(id: string, data: UpdatePlanDto) {
    if (data.isDefault) await this.ensureSingleDefault(true);
    
    // Destructure out tier prices just in case they are sent during an update 
    // (though usually handled via PriceBook endpoints now)
    const { highTierPrice, middleTierPrice, lowTierPrice, ...planData } = data as any;
    
    return this.prisma.plan.update({
      where: { id },
      data: planData,
      include: {
        priceBooks: true
      }
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
