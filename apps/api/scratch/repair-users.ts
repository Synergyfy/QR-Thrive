import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- USER PLAN REPAIR SCRIPT ---');

  // 1. Find the default plan (Free)
  let defaultPlan = await prisma.plan.findFirst({
    where: { isDefault: true, isActive: true, deletedAt: null },
  });

  if (!defaultPlan) {
    defaultPlan = await prisma.plan.findFirst({
      where: { name: 'Free', isActive: true, deletedAt: null },
    });
  }

  if (!defaultPlan) {
    defaultPlan = await prisma.plan.findFirst({
      where: { isActive: true, deletedAt: null },
    });
  }

  if (!defaultPlan) {
    console.error('ERROR: No active plans found in DB. Please run seeding first.');
    return;
  }

  console.log(`Found fallback plan: ${defaultPlan.name} (${defaultPlan.id})`);

  // 2. Find all users with NULL planId
  const usersToRepair = await prisma.user.findMany({
    where: { planId: null },
  });

  console.log(`Found ${usersToRepair.length} users with missing planId.`);

  // 3. Update them
  for (const user of usersToRepair) {
    await prisma.user.update({
      where: { id: user.id },
      data: { planId: defaultPlan.id },
    });
    console.log(`Repaired User: ${user.email}`);
  }

  console.log('--- REPAIR COMPLETED ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
