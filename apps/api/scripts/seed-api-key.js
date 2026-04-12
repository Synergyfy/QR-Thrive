const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// This script MUST be run from within the apps/api directory or with correct env
const prisma = new PrismaClient();

async function main() {
  const key = 'qrthrive_test_key_abc123';
  const hashedKey = crypto.createHash('sha256').update(key).digest('hex');

  await prisma.apiKey.upsert({
    where: { key: hashedKey },
    update: { isActive: true },
    create: {
      key: hashedKey,
      name: 'VemTap Integration',
      isActive: true,
    },
  });

  console.log('API Key seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
