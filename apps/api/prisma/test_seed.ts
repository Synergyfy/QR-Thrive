import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing connectivity...');
  const countries = await prisma.country.findMany();
  console.log('Countries in DB:', countries.length);
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
