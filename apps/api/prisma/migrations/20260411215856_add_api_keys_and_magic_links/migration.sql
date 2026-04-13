/*
  Warnings:

  - You are about to drop the `PlanPrice` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PlanPrice" DROP CONSTRAINT "PlanPrice_planId_fkey";

-- DropForeignKey
ALTER TABLE "PlanPrice" DROP CONSTRAINT "PlanPrice_tierId_fkey";

-- AlterTable
ALTER TABLE "Country" ALTER COLUMN "currencyCode" SET DEFAULT 'USD',
ALTER COLUMN "currencySymbol" SET DEFAULT '$';

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "highIncomeMonthlyUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "highIncomeQuarterlyUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "highIncomeYearlyUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lowIncomeMonthlyUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lowIncomeQuarterlyUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lowIncomeYearlyUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "middleIncomeMonthlyUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "middleIncomeQuarterlyUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "middleIncomeYearlyUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "trialDays" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasUsedTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "trialStartedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "PlanPrice";

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_userId_idx" ON "MagicLink"("userId");

-- CreateIndex
CREATE INDEX "MagicLink_token_idx" ON "MagicLink"("token");

-- AddForeignKey
ALTER TABLE "MagicLink" ADD CONSTRAINT "MagicLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
