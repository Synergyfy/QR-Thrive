import { PrismaClient, PricingTier, BillingCycle, PriceStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Starting Static Price Seed ---');

  const plans = await prisma.plan.findMany();
  const tiers = [PricingTier.HIGH, PricingTier.MIDDLE, PricingTier.LOW];
  const cycles = [BillingCycle.MONTHLY, BillingCycle.QUARTERLY, BillingCycle.YEARLY];

  const proPrices = {
    [PricingTier.HIGH]: { [BillingCycle.MONTHLY]: 20, [BillingCycle.QUARTERLY]: 54, [BillingCycle.YEARLY]: 192 },
    [PricingTier.MIDDLE]: { [BillingCycle.MONTHLY]: 10, [BillingCycle.QUARTERLY]: 27, [BillingCycle.YEARLY]: 96 },
    [PricingTier.LOW]: { [BillingCycle.MONTHLY]: 5, [BillingCycle.QUARTERLY]: 13.5, [BillingCycle.YEARLY]: 48 },
  };

  for (const plan of plans) {
    console.log(`Processing plan: ${plan.name} (${plan.id})`);

    for (const tier of tiers) {
      for (const cycle of cycles) {
        let price = 0;

        if (plan.isFree) {
          price = 0;
        } else if (plan.name === 'Pro') {
          price = proPrices[tier][cycle];
        } else {
          price = proPrices[PricingTier.HIGH][cycle];
        }

        const id = `${plan.name.toLowerCase()}-${tier.toLowerCase()}-${cycle.toLowerCase()}-usd`.replace(/\s+/g, '-');

        await prisma.priceBook.upsert({
          where: { id },
          update: {
            price,
            status: PriceStatus.ACTIVE,
            currencyCode: 'USD',
          },
          create: {
            id,
            planId: plan.id,
            tier,
            billingCycle: cycle,
            currencyCode: 'USD',
            price,
            status: PriceStatus.ACTIVE,
          },
        });
      }
    }
  }

  console.log('--- Static Price Seed Completed ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
