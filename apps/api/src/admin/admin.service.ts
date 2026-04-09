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

  async getStats(range = '7d') {
    const config = await this.getConfig();
    const monthlyPrice = config.monthlyPrice;

    const [totalUsers, totalQRs, totalScans, proUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.qRCode.count(),
      this.prisma.scan.count(),
      this.prisma.user.count({ where: { plan: 'PRO' } }),
    ]);

    const estimatedRevenue = proUsers * monthlyPrice;

    // Handle different ranges for chart data
    let periods: Date[] = [];
    if (range === '30d') {
      periods = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return d;
      }).reverse();
    } else if (range === 'all') {
      // Monthly resolution for the last 12 months for "All Time"
      periods = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
      }).reverse();
    } else {
      // Default to last 7 days daily resolution
      periods = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return d;
      }).reverse();
    }

    const chartData = await Promise.all(
      periods.map(async (date) => {
        const nextPeriod = new Date(date);
        if (range === 'all') {
          nextPeriod.setMonth(nextPeriod.getMonth() + 1);
        } else {
          nextPeriod.setDate(nextPeriod.getDate() + 1);
        }

        const count = await this.prisma.qRCode.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextPeriod,
            },
          },
        });

        let label = '';
        if (range === '7d') {
          label = date.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (range === '30d') {
          label = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        } else {
          label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }

        return {
          name: label,
          qrs: count,
        };
      }),
    );

    // Trends (Compare last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [currentPeriodUsers, previousPeriodUsers, currentPeriodScans, previousPeriodScans, currentPeriodQRs, previousPeriodQRs] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      this.prisma.scan.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.scan.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      this.prisma.qRCode.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.qRCode.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    ]);

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      // Using Math.min/max to cap extreme values if necessary, though not strictly required
      return Number(((current - previous) / previous * 100).toFixed(1));
    };

    return {
      totalUsers,
      totalQRs,
      totalScans,
      estimatedRevenue,
      chartData,
      trends: {
        users: calculateChange(currentPeriodUsers, previousPeriodUsers),
        scans: calculateChange(currentPeriodScans, previousPeriodScans),
        qrs: calculateChange(currentPeriodQRs, previousPeriodQRs),
        revenue: calculateChange(currentPeriodUsers, previousPeriodUsers), // Proxy for revenue growth
      },
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
      ...(status === 'active' && { subscriptionStatus: 'active', isBanned: false }),
      ...(status === 'inactive' && { 
        subscriptionStatus: { not: 'active' as const }, 
        isBanned: false 
      }),
      ...(status === 'banned' && { isBanned: true }),
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
          isBanned: true,
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

  async banUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { isBanned: !user.isBanned },
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async exportUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        plan: true,
        subscriptionStatus: true,
        isBanned: true,
        createdAt: true,
      },
    });

    const header = 'ID,Email,First Name,Last Name,Role,Plan,Status,Banned,Joined\n';
    const rows = users.map(u => 
      `${u.id},${u.email},${u.firstName},${u.lastName},${u.role},${u.plan},${u.subscriptionStatus || 'N/A'},${u.isBanned},${u.createdAt.toISOString()}`
    ).join('\n');

    return header + rows;
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
