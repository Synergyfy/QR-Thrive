import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from '../payments/paystack.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { SystemConfig } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private paystackService: PaystackService,
  ) {}

  async getStats() {
    const [totalUsers, totalQRs, totalScans, proUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.qRCode.count(),
      this.prisma.scan.count(),
      this.prisma.user.count({ where: { plan: 'PRO' } }),
    ]);

    // Simple revenue estimation (In reality, fetch from payment records if available)
    const monthlyPrice = 5000;
    const estimatedRevenue = proUsers * monthlyPrice;

    // Growth trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d;
    }).reverse();

    const chartData = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const count = await this.prisma.qRCode.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDay,
            },
          },
        });

        return {
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          qrs: count,
        };
      }),
    );

    return {
      totalUsers,
      totalQRs,
      totalScans,
      estimatedRevenue,
      chartData,
    };
  }

  async getUsers(page = 1, limit = 10, search = '', status?: string) {
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      // Status could map to user.subscriptionStatus or a new 'status' field
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          plan: true,
          subscriptionStatus: true,
          createdAt: true,
          _count: {
            select: { qrCodes: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        ...u,
        name: `${u.firstName} ${u.lastName}`,
        qrs: u._count.qrCodes,
      })),
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getConfig() {
    let config = await this.prisma.systemConfig.findFirst();
    if (!config) {
      // Create default config if not exists
      config = await this.prisma.systemConfig.create({
        data: {
          features: [
            'Unlimited QR Codes',
            'Unlimited Scans',
            'Download PNG & SVG',
            'Dynamic & Static QR Codes',
            'Custom Landing Pages',
            'Scan statistics',
            'API Access',
            'Bulk Creation',
            'Cancel any time',
          ],
          faqs: [
            {
              question: 'How does billing work?',
              answer: 'Securely via Paystack.',
            },
          ],
        },
      });
    }
    return config;
  }

  async updateConfig(data: UpdateSystemConfigDto) {
    const config = await this.getConfig();

    // Sync with Paystack if pricing changed
    if (
      (data.monthlyPrice !== undefined &&
        data.monthlyPrice !== config.monthlyPrice) ||
      (data.quarterlyPrice !== undefined &&
        data.quarterlyPrice !== config.quarterlyPrice) ||
      (data.yearlyPrice !== undefined &&
        data.yearlyPrice !== config.yearlyPrice)
    ) {
      await this.syncPlansWithPaystack(data, config);
    }

    return this.prisma.systemConfig.update({
      where: { id: config.id },
      data: data as any, // Prisma data matches DTO but need cast for Json fields
    });
  }

  private async syncPlansWithPaystack(
    newData: UpdateSystemConfigDto,
    oldData: SystemConfig,
  ) {
    // This logic would create or update plans on Paystack
    // For brevity, I'll implement a skeleton and assume Paystack handles plan creation

    if (
      newData.monthlyPrice !== undefined &&
      newData.monthlyPrice !== oldData.monthlyPrice
    ) {
      const plan = await this.paystackService.createPlan(
        'Pro Monthly',
        newData.monthlyPrice,
        'monthly',
      );
      newData.monthlyPlanCode = plan.plan_code;
    }

    if (
      newData.quarterlyPrice !== undefined &&
      newData.quarterlyPrice !== oldData.quarterlyPrice
    ) {
      const plan = await this.paystackService.createPlan(
        'Pro Quarterly',
        newData.quarterlyPrice,
        'quarterly',
      );
      newData.quarterlyPlanCode = plan.plan_code;
    }

    if (
      newData.yearlyPrice !== undefined &&
      newData.yearlyPrice !== oldData.yearlyPrice
    ) {
      const plan = await this.paystackService.createPlan(
        'Pro Yearly',
        newData.yearlyPrice,
        'annually',
      );
      newData.yearlyPlanCode = plan.plan_code;
    }
  }
}
