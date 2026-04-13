import { PrismaClient, PricingTier } from '@prisma/client';
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
  console.log('--- Starting Enum-based Country Seeding ---');

  const countries = [
    // --- TIER 1: HIGH INCOME ---
    { code: 'US', name: 'United States', currencyCode: 'USD', currencySymbol: '$', tier: PricingTier.HIGH },
    { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP', currencySymbol: '£', tier: PricingTier.HIGH },
    { code: 'CA', name: 'Canada', currencyCode: 'CAD', currencySymbol: '$', tier: PricingTier.HIGH },
    { code: 'AU', name: 'Australia', currencyCode: 'AUD', currencySymbol: '$', tier: PricingTier.HIGH },
    { code: 'DE', name: 'Germany', currencyCode: 'EUR', currencySymbol: '€', tier: PricingTier.HIGH },
    { code: 'FR', name: 'France', currencyCode: 'EUR', currencySymbol: '€', tier: PricingTier.HIGH },
    { code: 'JP', name: 'Japan', currencyCode: 'JPY', currencySymbol: '¥', tier: PricingTier.HIGH },
    { code: 'IT', name: 'Italy', currencyCode: 'EUR', currencySymbol: '€', tier: PricingTier.HIGH },
    { code: 'ES', name: 'Spain', currencyCode: 'EUR', currencySymbol: '€', tier: PricingTier.HIGH },
    { code: 'NL', name: 'Netherlands', currencyCode: 'EUR', currencySymbol: '€', tier: PricingTier.HIGH },
    { code: 'SE', name: 'Sweden', currencyCode: 'SEK', currencySymbol: 'kr', tier: PricingTier.HIGH },
    { code: 'NO', name: 'Norway', currencyCode: 'NOK', currencySymbol: 'kr', tier: PricingTier.HIGH },
    { code: 'CH', name: 'Switzerland', currencyCode: 'CHF', currencySymbol: 'CHf', tier: PricingTier.HIGH },
    { code: 'SG', name: 'Singapore', currencyCode: 'SGD', currencySymbol: '$', tier: PricingTier.HIGH },
    { code: 'AE', name: 'United Arab Emirates', currencyCode: 'AED', currencySymbol: 'د.إ', tier: PricingTier.HIGH },

    // --- TIER 2: MIDDLE INCOME ---
    { code: 'ZA', name: 'South Africa', currencyCode: 'ZAR', currencySymbol: 'R', tier: PricingTier.MIDDLE },
    { code: 'EG', name: 'Egypt', currencyCode: 'EGP', currencySymbol: 'E£', tier: PricingTier.MIDDLE },
    { code: 'MA', name: 'Morocco', currencyCode: 'MAD', currencySymbol: 'د.م.', tier: PricingTier.MIDDLE },
    { code: 'DZ', name: 'Algeria', currencyCode: 'DZD', currencySymbol: 'د.ج', tier: PricingTier.MIDDLE },
    { code: 'TN', name: 'Tunisia', currencyCode: 'TND', currencySymbol: 'د.ت', tier: PricingTier.MIDDLE },
    { code: 'MU', name: 'Mauritius', currencyCode: 'MUR', currencySymbol: '₨', tier: PricingTier.MIDDLE },
    { code: 'BW', name: 'Botswana', currencyCode: 'BWP', currencySymbol: 'P', tier: PricingTier.MIDDLE },
    { code: 'NA', name: 'Namibia', currencyCode: 'NAD', currencySymbol: '$', tier: PricingTier.MIDDLE },
    { code: 'IN', name: 'India', currencyCode: 'INR', currencySymbol: '₹', tier: PricingTier.MIDDLE },
    { code: 'BR', name: 'Brazil', currencyCode: 'BRL', currencySymbol: 'R$', tier: PricingTier.MIDDLE },
    { code: 'MX', name: 'Mexico', currencyCode: 'MXN', currencySymbol: '$', tier: PricingTier.MIDDLE },
    { code: 'TR', name: 'Turkey', currencyCode: 'TRY', currencySymbol: '₺', tier: PricingTier.MIDDLE },
    { code: 'MY', name: 'Malaysia', currencyCode: 'MYR', currencySymbol: 'RM', tier: PricingTier.MIDDLE },
    { code: 'TH', name: 'Thailand', currencyCode: 'THB', currencySymbol: '฿', tier: PricingTier.MIDDLE },
    { code: 'ID', name: 'Indonesia', currencyCode: 'IDR', currencySymbol: 'Rp', tier: PricingTier.MIDDLE },

    // --- TIER 3: LOW INCOME (Heavy African Focus) ---
    { code: 'NG', name: 'Nigeria', currencyCode: 'NGN', currencySymbol: '₦', tier: PricingTier.LOW },
    { code: 'KE', name: 'Kenya', currencyCode: 'KES', currencySymbol: 'KSh', tier: PricingTier.LOW },
    { code: 'GH', name: 'Ghana', currencyCode: 'GHS', currencySymbol: 'GH₵', tier: PricingTier.LOW },
    { code: 'ET', name: 'Ethiopia', currencyCode: 'ETB', currencySymbol: 'Br', tier: PricingTier.LOW },
    { code: 'TZ', name: 'Tanzania', currencyCode: 'TZS', currencySymbol: 'TSh', tier: PricingTier.LOW },
    { code: 'UG', name: 'Uganda', currencyCode: 'UGX', currencySymbol: 'USh', tier: PricingTier.LOW },
    { code: 'RW', name: 'Rwanda', currencyCode: 'RWF', currencySymbol: 'FRw', tier: PricingTier.LOW },
    { code: 'SN', name: 'Senegal', currencyCode: 'XOF', currencySymbol: 'CFA', tier: PricingTier.LOW },
    { code: 'CI', name: 'Ivory Coast', currencyCode: 'XOF', currencySymbol: 'CFA', tier: PricingTier.LOW },
    { code: 'CM', name: 'Cameroon', currencyCode: 'XAF', currencySymbol: 'CFA', tier: PricingTier.LOW },
    { code: 'AO', name: 'Angola', currencyCode: 'AOA', currencySymbol: 'Kz', tier: PricingTier.LOW },
    { code: 'ZM', name: 'Zambia', currencyCode: 'ZMW', currencySymbol: 'ZK', tier: PricingTier.LOW },
    { code: 'MW', name: 'Malawi', currencyCode: 'MWK', currencySymbol: 'MK', tier: PricingTier.LOW },
    { code: 'MZ', name: 'Mozambique', currencyCode: 'MZN', currencySymbol: 'MT', tier: PricingTier.LOW },
    { code: 'CD', name: 'DR Congo', currencyCode: 'CDF', currencySymbol: 'FC', tier: PricingTier.LOW },
    { code: 'PK', name: 'Pakistan', currencyCode: 'PKR', currencySymbol: '₨', tier: PricingTier.LOW },
    { code: 'VN', name: 'Vietnam', currencyCode: 'VND', currencySymbol: '₫', tier: PricingTier.LOW },
    { code: 'BD', name: 'Bangladesh', currencyCode: 'BDT', currencySymbol: '৳', tier: PricingTier.LOW },
    { code: 'PH', name: 'Philippines', currencyCode: 'PHP', currencySymbol: '₱', tier: PricingTier.LOW },
    { code: 'NP', name: 'Nepal', currencyCode: 'NPR', currencySymbol: '₨', tier: PricingTier.LOW },
    { code: 'LK', name: 'Sri Lanka', currencyCode: 'LKR', currencySymbol: '₨', tier: PricingTier.LOW },
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
