import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing connectivity...');
  const tiers = await prisma.tier.findMany();
  console.log('Tiers in DB:', tiers.length);
  console.log('Success!');
}

main()
  .catch((e) => {
    console.error('Error in minimal seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
