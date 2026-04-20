import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import 'dotenv/config';

const prisma = new PrismaClient();

async function seed() {
  const rawKey = 'qrthrive_test_key_abc123'; // The key VemTap uses to call QR-Thrive
  const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

  console.log(`Seeding API Key: ${rawKey}`);
  console.log(`Hashed Key: ${hashedKey}`);

  await prisma.apiKey.upsert({
    where: { key: hashedKey },
    update: { isActive: true },
    create: {
      key: hashedKey,
      name: 'VemTap Integration Key',
      isActive: true
    }
  });

  console.log('✅ API Key successfully seeded in QR-Thrive database.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
