import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const country = await prisma.country.findUnique({ where: { code: 'NG' } });
    console.log('Country Info (NG):', JSON.stringify(country, null, 2));

    const priceBooks = await prisma.priceBook.findMany({
      where: {
        planId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b',
        currencyCode: 'NGN'
      }
    });
    console.log('NGN PriceBooks for Plan:', JSON.stringify(priceBooks, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
