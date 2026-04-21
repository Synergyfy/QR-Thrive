import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from '../payments/paystack.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CreatePriceBookDto } from './dto/create-price-book.dto';
import { UpdatePriceBookDto } from './dto/update-price-book.dto';
import { GrantPlanDto, GiftPlanDuration } from './dto/grant-plan.dto';
import { SystemConfig, PricingTier, PriceStatus, BillingCycle } from '@prisma/client';
import { VemtapService } from '../integration/vemtap.service';
import { PricingService } from '../pricing/pricing.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private paystackService: PaystackService,
    private pricingService: PricingService,
    private vemtapService: VemtapService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getStats(range = '7d') {
    const config = await this.prisma.systemConfig.findFirst();
    const [totalUsers, totalQRs, totalScans, activeSubscribers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.qRCode.count(),
        this.prisma.scan.count(),
        this.prisma.user.count({
          where: {
            plan: { isDefault: false },
          },
        }),
      ]);

    // Estimated revenue is complex now with tiers.
    // For simplicity in stats, we might just sum some values or keep it symbolic.
    // The user didn't ask for a complex revenue model yet, but let's fix the broken part.
    const estimatedRevenue =
      activeSubscribers * (config?.quarterlyDiscount || 0); // Placeholder or keep it simple

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
          label = date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
          });
        } else {
          label = date.toLocaleDateString('en-US', {
            month: 'short',
            year: '2-digit',
          });
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

    const [
      currentPeriodUsers,
      previousPeriodUsers,
      currentPeriodScans,
      previousPeriodScans,
      currentPeriodQRs,
      previousPeriodQRs,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      this.prisma.scan.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.scan.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      this.prisma.qRCode.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.qRCode.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
    ]);

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      // Using Math.min/max to cap extreme values if necessary, though not strictly required
      return Number((((current - previous) / previous) * 100).toFixed(1));
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
      ...(status === 'active' && {
        subscriptionStatus: 'active',
        isBanned: false,
      }),
      ...(status === 'inactive' && {
        subscriptionStatus: { not: 'active' as const },
        isBanned: false,
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

    // Sync with Paystack if pricing changed (Legacy - needs refactor for tiered pricing)
    // if (
    //   (data.quarterlyDiscount !== undefined &&
    //     data.quarterlyDiscount !== config.quarterlyDiscount) ||
    //   (data.yearlyDiscount !== undefined &&
    //     data.yearlyDiscount !== config.yearlyDiscount)
    // ) {
    //   await this.syncPlansWithPaystack(data, config);
    // }

    return this.prisma.systemConfig.update({
      where: { id: config.id },
      data: data as any,
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

    const header =
      'ID,Email,First Name,Last Name,Role,Plan,Status,Banned,Joined\n';
    const rows = users
      .map(
        (u) =>
          `${u.id},${u.email},${u.firstName},${u.lastName},${u.role},${u.plan},${u.subscriptionStatus || 'N/A'},${u.isBanned},${u.createdAt.toISOString()}`,
      )
      .join('\n');

    return header + rows;
  }

  // Country Management
  async getCountries(tier?: PricingTier) {
    return this.prisma.country.findMany({
      where: tier ? { tier } : {},
      orderBy: { name: 'asc' },
    });
  }

  async updateCountry(code: string, data: UpdateCountryDto) {
    const country = await this.prisma.country.findUnique({ where: { code } });
    if (!country) throw new NotFoundException('Country not found');

    const updated = await this.prisma.country.update({
      where: { code },
      data,
    });

    // Invalidate cache for the affected tier and currency
    await this.cacheManager.del(
      `pricing:plans:tier:${updated.tier}:currency:${updated.currencyCode}`,
    );

    return updated;
  }

  // PriceBook Management
  async getPlanPrices(planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    return this.prisma.priceBook.findMany({
      where: { planId },
      orderBy: [
        { tier: 'asc' },
        { billingCycle: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async createPriceBook(planId: string, data: CreatePriceBookDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const priceBook = await this.prisma.priceBook.create({
      data: {
        ...data,
        planId,
      },
    });

    // AUTO-CALCULATION: If this is a MONTHLY entry, auto-generate Quarterly and Yearly
    if (data.billingCycle === BillingCycle.MONTHLY) {
      this.logger.log(`Auto-calculating cycle prices for plan ${planId}, tier ${data.tier}, currency ${data.currencyCode}`);
      
      const discounted = await this.pricingService.calculateDiscountedPrices(
        data.price,
        data.currencyCode,
      );

      const otherCycles = [
        { cycle: BillingCycle.QUARTERLY, price: discounted.quarterly },
        { cycle: BillingCycle.YEARLY, price: discounted.yearly },
      ];

      for (const item of otherCycles) {
        // Check if it already exists (to avoid overwriting manual overrides)
        const existing = await this.prisma.priceBook.findFirst({
          where: {
            planId,
            tier: data.tier,
            currencyCode: data.currencyCode,
            billingCycle: item.cycle,
          },
        });

        if (!existing) {
          await this.prisma.priceBook.create({
            data: {
              planId,
              tier: data.tier,
              currencyCode: data.currencyCode,
              billingCycle: item.cycle,
              price: item.price,
              status: data.status || PriceStatus.ACTIVE,
            },
          });
        }
      }
    }

    // Invalidate cache
    await this.cacheManager.del(
      `pricing:plans:tier:${priceBook.tier}:currency:${priceBook.currencyCode}`,
    );
    await this.cacheManager.del(
      `pricing:plan:${planId}:tier:${priceBook.tier}:currency:${priceBook.currencyCode}`,
    );

    return priceBook;
  }

  async updatePriceBook(id: string, data: UpdatePriceBookDto) {
    const priceBook = await this.prisma.priceBook.findUnique({ where: { id } });
    if (!priceBook) throw new NotFoundException('Price book entry not found');

    const updated = await this.prisma.priceBook.update({
      where: { id },
      data,
    });

    // Invalidate cache
    await this.cacheManager.del(
      `pricing:plans:tier:${updated.tier}:currency:${updated.currencyCode}`,
    );
    await this.cacheManager.del(
      `pricing:plan:${updated.planId}:tier:${updated.tier}:currency:${updated.currencyCode}`,
    );

    return updated;
  }

  /**
   * Cron job that runs every minute to invalidate cache for prices that just became active.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledPriceInvalidation() {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    // Find PriceBooks that became active in the last minute
    const newlyActivePrices = await this.prisma.priceBook.findMany({
      where: {
        status: PriceStatus.ACTIVE,
        activeFrom: {
          gte: oneMinuteAgo,
          lte: now,
        },
      },
    });

    if (newlyActivePrices.length > 0) {
      this.logger.log(
        `Invalidating cache for ${newlyActivePrices.length} newly active prices.`,
      );
      for (const price of newlyActivePrices) {
        await this.cacheManager.del(
          `pricing:plans:tier:${price.tier}:currency:${price.currencyCode}`,
        );
        await this.cacheManager.del(
          `pricing:plan:${price.planId}:tier:${price.tier}:currency:${price.currencyCode}`,
        );
      }
    }
  }

  async grantPlan(userId: string, dto: GrantPlanDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const now = new Date();
    const expirationDate = new Date();

    switch (dto.duration) {
      case GiftPlanDuration.MONTH:
        expirationDate.setDate(now.getDate() + 30);
        break;
      case GiftPlanDuration.QUARTER:
        expirationDate.setDate(now.getDate() + 90);
        break;
      case GiftPlanDuration.YEAR:
        expirationDate.setDate(now.getDate() + 365);
        break;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        planId: plan.id,
        subscriptionStatus: 'active',
        billingCycle: dto.duration,
        trialEndsAt: expirationDate,
        // Ensure we clear any old paystack subscription code as this is a gifted plan
        paystackSubscriptionCode: null,
      },
      include: { plan: true },
    });

    // Provision on Vemtap if applicable
    if (updatedUser.plan?.vemtapPlanId) {
      this.vemtapService
        .provisionUser(
          updatedUser.email,
          updatedUser.firstName,
          updatedUser.lastName,
          updatedUser.plan.vemtapPlanId,
        )
        .catch((err) => {
          this.logger.error(
            `Vemtap provisioning failed for ${updatedUser.email} during gift grant:`,
            err,
          );
        });
    }

    return {
      message: `Successfully granted ${plan.name} for 1 ${dto.duration}`,
      expiresAt: expirationDate,
    };
  }

  /**
   * Cron job that runs every hour to downgrade expired gifted or trial plans.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handlePlanExpirations() {
    const now = new Date();

    // Find users whose trial/gift period has ended and who have no active Paystack subscription
    const expiredUsers = await this.prisma.user.findMany({
      where: {
        trialEndsAt: { lt: now },
        subscriptionStatus: { in: ['active', 'trialing'] },
        paystackSubscriptionCode: null,
      },
    });

    if (expiredUsers.length === 0) return;

    this.logger.log(`Handling expiration for ${expiredUsers.length} users.`);

    // Get the default free plan
    const freePlan = await this.prisma.plan.findFirst({
      where: { isDefault: true },
    });

    for (const user of expiredUsers) {
      try {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            planId: freePlan?.id || null,
            subscriptionStatus: 'expired',
            billingCycle: null,
            trialEndsAt: null,
          },
        });
        this.logger.log(`User ${user.email} subscription expired and downgraded.`);
      } catch (err) {
        this.logger.error(`Failed to downgrade user ${user.email}:`, err);
      }
    }
  }

  private async syncPlansWithPaystack(newData: any, oldData: any) {
    // Legacy sync logic disabled for now as we transition to tiered pricing
    /*
    if (
      newData.monthlyPrice !== undefined &&
      newData.monthlyPrice !== oldData.monthlyPrice
    ) ...
    */
  }
}
