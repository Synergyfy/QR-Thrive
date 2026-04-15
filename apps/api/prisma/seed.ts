import { PrismaClient, QRType, PricingTier } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding countries...');
  const countries = [
    // High Income
    { code: 'US', name: 'United States', currencyCode: 'USD', currencySymbol: '$', tier: PricingTier.HIGH },
    { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP', currencySymbol: '£', tier: PricingTier.HIGH },
    { code: 'CA', name: 'Canada', currencyCode: 'CAD', currencySymbol: '$', tier: PricingTier.HIGH },
    { code: 'AU', name: 'Australia', currencyCode: 'AUD', currencySymbol: '$', tier: PricingTier.HIGH },
    { code: 'DE', name: 'Germany', currencyCode: 'EUR', currencySymbol: '€', tier: PricingTier.HIGH },
    { code: 'FR', name: 'France', currencyCode: 'EUR', currencySymbol: '€', tier: PricingTier.HIGH },
    { code: 'JP', name: 'Japan', currencyCode: 'JPY', currencySymbol: '¥', tier: PricingTier.HIGH },
    
    // Middle Income
    { code: 'BR', name: 'Brazil', currencyCode: 'BRL', currencySymbol: 'R$', tier: PricingTier.MIDDLE },
    { code: 'IN', name: 'India', currencyCode: 'INR', currencySymbol: '₹', tier: PricingTier.MIDDLE },
    { code: 'MX', name: 'Mexico', currencyCode: 'MXN', currencySymbol: '$', tier: PricingTier.MIDDLE },
    { code: 'TR', name: 'Turkey', currencyCode: 'TRY', currencySymbol: '₺', tier: PricingTier.MIDDLE },
    { code: 'ZA', name: 'South Africa', currencyCode: 'ZAR', currencySymbol: 'R', tier: PricingTier.MIDDLE },
    
    // Low Income
    { code: 'NG', name: 'Nigeria', currencyCode: 'NGN', currencySymbol: '₦', tier: PricingTier.LOW },
    { code: 'PK', name: 'Pakistan', currencyCode: 'PKR', currencySymbol: '₨', tier: PricingTier.LOW },
    { code: 'EG', name: 'Egypt', currencyCode: 'EGP', currencySymbol: 'E£', tier: PricingTier.LOW },
    { code: 'VN', name: 'Vietnam', currencyCode: 'VND', currencySymbol: '₫', tier: PricingTier.LOW },
    { code: 'BD', name: 'Bangladesh', currencyCode: 'BDT', currencySymbol: '৳', tier: PricingTier.LOW },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: country,
      create: country,
    });
  }

  console.log('Seeding plans and prices...');
  const freePlan = await prisma.plan.upsert({
    where: { name: 'Free' },
    update: {
      qrCodeLimit: 5,
      qrCodeTypes: [QRType.url, QRType.text],
      isDefault: true,
      isActive: true,
      isFree: true,
    },
    create: {
      name: 'Free',
      description: 'Basic features for personal use',
      qrCodeLimit: 5,
      qrCodeTypes: [QRType.url, QRType.text],
      isDefault: true,
      isActive: true,
      isFree: true,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { name: 'Pro' },
    update: {
      qrCodeLimit: 100,
      qrCodeTypes: Object.values(QRType),
      isPopular: true,
      isActive: true,
    },
    create: {
      name: 'Pro',
      description: 'Advanced features for businesses',
      qrCodeLimit: 100,
      qrCodeTypes: Object.values(QRType),
      isPopular: true,
      isActive: true,
    },
  });

  const billingCycles = ['MONTHLY', 'QUARTERLY', 'YEARLY'] as const;
  const tiers = [PricingTier.HIGH, PricingTier.MIDDLE, PricingTier.LOW];

  const proPrices = {
    [PricingTier.HIGH]: { MONTHLY: 20, QUARTERLY: 54, YEARLY: 192 },
    [PricingTier.MIDDLE]: { MONTHLY: 10, QUARTERLY: 27, YEARLY: 96 },
    [PricingTier.LOW]: { MONTHLY: 5, QUARTERLY: 13.5, YEARLY: 48 },
  };

  for (const tier of tiers) {
    for (const cycle of billingCycles) {
      // Free Plan Prices
      await prisma.priceBook.upsert({
        where: {
          id: `free-${tier}-${cycle}`.toLowerCase(), // Not a real cuid but for seeding consistency if we used cuid() we'd need another unique way
        },
        create: {
          id: `free-${tier}-${cycle}`.toLowerCase(),
          planId: freePlan.id,
          tier,
          currencyCode: 'USD',
          billingCycle: cycle as any,
          price: 0,
          status: 'ACTIVE',
        },
        update: {
          price: 0,
          status: 'ACTIVE',
        },
      });

      // Pro Plan Prices
      await prisma.priceBook.upsert({
        where: {
          id: `pro-${tier}-${cycle}`.toLowerCase(),
        },
        create: {
          id: `pro-${tier}-${cycle}`.toLowerCase(),
          planId: proPlan.id,
          tier,
          currencyCode: 'USD',
          billingCycle: cycle as any,
          price: proPrices[tier][cycle],
          status: 'ACTIVE',
        },
        update: {
          price: proPrices[tier][cycle],
          status: 'ACTIVE',
        },
      });
    }
  }

  console.log('Seeding system config...');
  await prisma.systemConfig.upsert({
    where: { id: 1 },
    update: {
      quarterlyDiscount: 10,
      yearlyDiscount: 20,
    },
    create: {
      id: 1,
      quarterlyDiscount: 10,
      yearlyDiscount: 20,
      heroTitle: 'Turn Every Scan Into a Customer',
      heroSubtitle: 'Qrthrive helps you create powerful, branded QR codes.',
      features: ['Unlimited Dynamic QR Codes', 'Advanced Analytics', 'Custom Branded Domains'],
      faqs: [{ question: 'What is a Dynamic QR code?', answer: 'It is a QR code that you can edit anytime.' }],
    },
  });

  console.log('Seed completed successfully.');
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
