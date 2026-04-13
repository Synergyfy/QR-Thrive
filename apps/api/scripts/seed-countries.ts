import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from apps/api/
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not defined in the environment.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Starting Expanded Country Seeding ---');

  // 1. Ensure Tiers exist
  const tier1 = await prisma.tier.upsert({
    where: { name: 'High Income' },
    update: {},
    create: { name: 'High Income' },
  });

  const tier2 = await prisma.tier.upsert({
    where: { name: 'Middle Income' },
    update: {},
    create: { name: 'Middle Income' },
  });

  const tier3 = await prisma.tier.upsert({
    where: { name: 'Low Income' },
    update: {},
    create: { name: 'Low Income' },
  });

  const countries = [
    // --- TIER 1: HIGH INCOME ---
    { code: 'US', name: 'United States', currencyCode: 'USD', currencySymbol: '$', tierId: tier1.id },
    { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP', currencySymbol: '£', tierId: tier1.id },
    { code: 'CA', name: 'Canada', currencyCode: 'CAD', currencySymbol: '$', tierId: tier1.id },
    { code: 'AU', name: 'Australia', currencyCode: 'AUD', currencySymbol: '$', tierId: tier1.id },
    { code: 'DE', name: 'Germany', currencyCode: 'EUR', currencySymbol: '€', tierId: tier1.id },
    { code: 'FR', name: 'France', currencyCode: 'EUR', currencySymbol: '€', tierId: tier1.id },
    { code: 'JP', name: 'Japan', currencyCode: 'JPY', currencySymbol: '¥', tierId: tier1.id },
    { code: 'IT', name: 'Italy', currencyCode: 'EUR', currencySymbol: '€', tierId: tier1.id },
    { code: 'ES', name: 'Spain', currencyCode: 'EUR', currencySymbol: '€', tierId: tier1.id },
    { code: 'NL', name: 'Netherlands', currencyCode: 'EUR', currencySymbol: '€', tierId: tier1.id },
    { code: 'SE', name: 'Sweden', currencyCode: 'SEK', currencySymbol: 'kr', tierId: tier1.id },
    { code: 'NO', name: 'Norway', currencyCode: 'NOK', currencySymbol: 'kr', tierId: tier1.id },
    { code: 'CH', name: 'Switzerland', currencyCode: 'CHF', currencySymbol: 'CHf', tierId: tier1.id },
    { code: 'SG', name: 'Singapore', currencyCode: 'SGD', currencySymbol: '$', tierId: tier1.id },
    { code: 'AE', name: 'United Arab Emirates', currencyCode: 'AED', currencySymbol: 'د.إ', tierId: tier1.id },

    // --- TIER 2: MIDDLE INCOME ---
    { code: 'ZA', name: 'South Africa', currencyCode: 'ZAR', currencySymbol: 'R', tierId: tier2.id },
    { code: 'EG', name: 'Egypt', currencyCode: 'EGP', currencySymbol: 'E£', tierId: tier2.id },
    { code: 'MA', name: 'Morocco', currencyCode: 'MAD', currencySymbol: 'د.م.', tierId: tier2.id },
    { code: 'DZ', name: 'Algeria', currencyCode: 'DZD', currencySymbol: 'د.ج', tierId: tier2.id },
    { code: 'TN', name: 'Tunisia', currencyCode: 'TND', currencySymbol: 'د.ت', tierId: tier2.id },
    { code: 'MU', name: 'Mauritius', currencyCode: 'MUR', currencySymbol: '₨', tierId: tier2.id },
    { code: 'BW', name: 'Botswana', currencyCode: 'BWP', currencySymbol: 'P', tierId: tier2.id },
    { code: 'NA', name: 'Namibia', currencyCode: 'NAD', currencySymbol: '$', tierId: tier2.id },
    { code: 'IN', name: 'India', currencyCode: 'INR', currencySymbol: '₹', tierId: tier2.id },
    { code: 'BR', name: 'Brazil', currencyCode: 'BRL', currencySymbol: 'R$', tierId: tier2.id },
    { code: 'MX', name: 'Mexico', currencyCode: 'MXN', currencySymbol: '$', tierId: tier2.id },
    { code: 'TR', name: 'Turkey', currencyCode: 'TRY', currencySymbol: '₺', tierId: tier2.id },
    { code: 'MY', name: 'Malaysia', currencyCode: 'MYR', currencySymbol: 'RM', tierId: tier2.id },
    { code: 'TH', name: 'Thailand', currencyCode: 'THB', currencySymbol: '฿', tierId: tier2.id },
    { code: 'ID', name: 'Indonesia', currencyCode: 'IDR', currencySymbol: 'Rp', tierId: tier2.id },

    // --- TIER 3: LOW INCOME (Heavy African Focus) ---
    { code: 'NG', name: 'Nigeria', currencyCode: 'NGN', currencySymbol: '₦', tierId: tier3.id },
    { code: 'KE', name: 'Kenya', currencyCode: 'KES', currencySymbol: 'KSh', tierId: tier3.id },
    { code: 'GH', name: 'Ghana', currencyCode: 'GHS', currencySymbol: 'GH₵', tierId: tier3.id },
    { code: 'ET', name: 'Ethiopia', currencyCode: 'ETB', currencySymbol: 'Br', tierId: tier3.id },
    { code: 'TZ', name: 'Tanzania', currencyCode: 'TZS', currencySymbol: 'TSh', tierId: tier3.id },
    { code: 'UG', name: 'Uganda', currencyCode: 'UGX', currencySymbol: 'USh', tierId: tier3.id },
    { code: 'RW', name: 'Rwanda', currencyCode: 'RWF', currencySymbol: 'FRw', tierId: tier3.id },
    { code: 'SN', name: 'Senegal', currencyCode: 'XOF', currencySymbol: 'CFA', tierId: tier3.id },
    { code: 'CI', name: 'Ivory Coast', currencyCode: 'XOF', currencySymbol: 'CFA', tierId: tier3.id },
    { code: 'CM', name: 'Cameroon', currencyCode: 'XAF', currencySymbol: 'CFA', tierId: tier3.id },
    { code: 'AO', name: 'Angola', currencyCode: 'AOA', currencySymbol: 'Kz', tierId: tier3.id },
    { code: 'ZM', name: 'Zambia', currencyCode: 'ZMW', currencySymbol: 'ZK', tierId: tier3.id },
    { code: 'MW', name: 'Malawi', currencyCode: 'MWK', currencySymbol: 'MK', tierId: tier3.id },
    { code: 'MZ', name: 'Mozambique', currencyCode: 'MZN', currencySymbol: 'MT', tierId: tier3.id },
    { code: 'CD', name: 'DR Congo', currencyCode: 'CDF', currencySymbol: 'FC', tierId: tier3.id },
    { code: 'PK', name: 'Pakistan', currencyCode: 'PKR', currencySymbol: '₨', tierId: tier3.id },
    { code: 'VN', name: 'Vietnam', currencyCode: 'VND', currencySymbol: '₫', tierId: tier3.id },
    { code: 'BD', name: 'Bangladesh', currencyCode: 'BDT', currencySymbol: '৳', tierId: tier3.id },
    { code: 'PH', name: 'Philippines', currencyCode: 'PHP', currencySymbol: '₱', tierId: tier3.id },
    { code: 'NP', name: 'Nepal', currencyCode: 'NPR', currencySymbol: '₨', tierId: tier3.id },
    { code: 'LK', name: 'Sri Lanka', currencyCode: 'LKR', currencySymbol: '₨', tierId: tier3.id },
  ];

  console.log(`Processing ${countries.length} countries...`);

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: country,
      create: country,
    });
  }

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
