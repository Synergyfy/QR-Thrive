import { PrismaClient, PriceStatus } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const prices = await prisma.priceBook.findMany({
      where: { currencyCode: 'NGN' },
      include: { plan: true }
    });
    console.log('NGN Prices found:', prices.length);
    prices.forEach(p => {
      console.log(`Plan: ${p.plan.name}, Price: ${p.price}, Status: ${p.status}, Tier: ${p.tier}, Cycle: ${p.billingCycle}`);
    });

    const rates = await prisma.systemConfig.findFirst();
    console.log('System Config Discounts:', rates);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
