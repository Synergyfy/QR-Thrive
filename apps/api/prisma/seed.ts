import { PrismaClient, QRType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding tiers...');
  const tier1 = await prisma.tier.upsert({
    where: { name: 'Tier 1' },
    update: {},
    create: { name: 'Tier 1' },
  });

  const tier2 = await prisma.tier.upsert({
    where: { name: 'Tier 2' },
    update: {},
    create: { name: 'Tier 2' },
  });

  const tier3 = await prisma.tier.upsert({
    where: { name: 'Tier 3' },
    update: {},
    create: { name: 'Tier 3' },
  });

  console.log('Seeding countries...');
  const countries = [
    // Tier 1
    { code: 'US', name: 'United States', currencyCode: 'USD', currencySymbol: '$', tierId: tier1.id },
    { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP', currencySymbol: '£', tierId: tier1.id },
    { code: 'CA', name: 'Canada', currencyCode: 'CAD', currencySymbol: '$', tierId: tier1.id },
    { code: 'AU', name: 'Australia', currencyCode: 'AUD', currencySymbol: '$', tierId: tier1.id },
    { code: 'DE', name: 'Germany', currencyCode: 'EUR', currencySymbol: '€', tierId: tier1.id },
    { code: 'FR', name: 'France', currencyCode: 'EUR', currencySymbol: '€', tierId: tier1.id },
    { code: 'JP', name: 'Japan', currencyCode: 'JPY', currencySymbol: '¥', tierId: tier1.id },
    
    // Tier 2
    { code: 'BR', name: 'Brazil', currencyCode: 'BRL', currencySymbol: 'R$', tierId: tier2.id },
    { code: 'IN', name: 'India', currencyCode: 'INR', currencySymbol: '₹', tierId: tier2.id },
    { code: 'MX', name: 'Mexico', currencyCode: 'MXN', currencySymbol: '$', tierId: tier2.id },
    { code: 'TR', name: 'Turkey', currencyCode: 'TRY', currencySymbol: '₺', tierId: tier2.id },
    { code: 'ZA', name: 'South Africa', currencyCode: 'ZAR', currencySymbol: 'R', tierId: tier2.id },
    
    // Tier 3
    { code: 'NG', name: 'Nigeria', currencyCode: 'NGN', currencySymbol: '₦', tierId: tier3.id },
    { code: 'PK', name: 'Pakistan', currencyCode: 'PKR', currencySymbol: '₨', tierId: tier3.id },
    { code: 'EG', name: 'Egypt', currencyCode: 'EGP', currencySymbol: 'E£', tierId: tier3.id },
    { code: 'VN', name: 'Vietnam', currencyCode: 'VND', currencySymbol: '₫', tierId: tier3.id },
    { code: 'BD', name: 'Bangladesh', currencyCode: 'BDT', currencySymbol: '৳', tierId: tier3.id },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: country,
      create: country,
    });
  }

  console.log('Seeding plans...');
  const freePlan = await prisma.plan.upsert({
    where: { name: 'Free' },
    update: {
      qrCodeLimit: 5,
      qrCodeTypes: [QRType.url, QRType.text],
      isDefault: true,
      isActive: true,
    },
    create: {
      name: 'Free',
      description: 'Basic features for personal use',
      qrCodeLimit: 5,
      qrCodeTypes: [QRType.url, QRType.text],
      isDefault: true,
      isActive: true,
    },
  });
  
  const planPro = await prisma.plan.upsert({
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

  console.log('Seeding plan prices...');
  const prices = [
    // Pro Plan Prices in USD
    { planId: planPro.id, tierId: tier1.id, monthlyPriceUSD: 20 },
    { planId: planPro.id, tierId: tier2.id, monthlyPriceUSD: 10 },
    { planId: planPro.id, tierId: tier3.id, monthlyPriceUSD: 5 },
  ];

  for (const price of prices) {
    await prisma.planPrice.upsert({
      where: {
        planId_tierId: {
          planId: price.planId,
          tierId: price.tierId,
        },
      },
      update: price,
      create: price,
    });
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
