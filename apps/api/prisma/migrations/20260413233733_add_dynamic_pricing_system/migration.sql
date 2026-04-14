/*
  Warnings:

  - You are about to drop the column `highIncomeMonthlyUSD` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `highIncomeQuarterlyUSD` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `highIncomeYearlyUSD` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `lowIncomeMonthlyUSD` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `lowIncomeQuarterlyUSD` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `lowIncomeYearlyUSD` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `middleIncomeMonthlyUSD` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `middleIncomeQuarterlyUSD` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `middleIncomeYearlyUSD` on the `Plan` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME');

-- CreateEnum
CREATE TYPE "PriceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Country" ADD COLUMN     "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "highIncomeMonthlyUSD",
DROP COLUMN "highIncomeQuarterlyUSD",
DROP COLUMN "highIncomeYearlyUSD",
DROP COLUMN "lowIncomeMonthlyUSD",
DROP COLUMN "lowIncomeQuarterlyUSD",
DROP COLUMN "lowIncomeYearlyUSD",
DROP COLUMN "middleIncomeMonthlyUSD",
DROP COLUMN "middleIncomeQuarterlyUSD",
DROP COLUMN "middleIncomeYearlyUSD";

-- CreateTable
CREATE TABLE "price_books" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "tier" "PricingTier" NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "price" DOUBLE PRECISION NOT NULL,
    "status" "PriceStatus" NOT NULL DEFAULT 'DRAFT',
    "activeFrom" TIMESTAMP(3),
    "activeTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_books_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_books_planId_tier_currencyCode_status_idx" ON "price_books"("planId", "tier", "currencyCode", "status");

-- AddForeignKey
ALTER TABLE "price_books" ADD CONSTRAINT "price_books_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
