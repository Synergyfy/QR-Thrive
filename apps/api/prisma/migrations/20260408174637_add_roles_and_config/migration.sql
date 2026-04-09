/*
  Warnings:

  - A unique constraint covering the columns `[paystackCustomerCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paystackSubscriptionCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "billingCycle" TEXT,
ADD COLUMN     "paystackCustomerCode" TEXT,
ADD COLUMN     "paystackSubscriptionCode" TEXT,
ADD COLUMN     "plan" "PlanType" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ADD COLUMN     "subscriptionStatus" TEXT;

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "monthlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "quarterlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 13500,
    "yearlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 50000,
    "monthlyPlanCode" TEXT,
    "quarterlyPlanCode" TEXT,
    "yearlyPlanCode" TEXT,
    "heroTitle" TEXT NOT NULL DEFAULT 'Turn Every Scan Into a Customer',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Qrthrive helps you create powerful, branded QR codes.',
    "features" JSONB NOT NULL,
    "faqs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_paystackCustomerCode_key" ON "User"("paystackCustomerCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_paystackSubscriptionCode_key" ON "User"("paystackSubscriptionCode");
