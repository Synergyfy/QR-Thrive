/*
  Warnings:

  - You are about to drop the column `tierId` on the `Country` table. All the data in the column will be lost.
  - You are about to drop the `Tier` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PricingTier" AS ENUM ('HIGH', 'MIDDLE', 'LOW');

-- DropForeignKey
ALTER TABLE "Country" DROP CONSTRAINT "Country_tierId_fkey";

-- AlterTable
ALTER TABLE "Country" DROP COLUMN "tierId",
ADD COLUMN     "tier" "PricingTier" NOT NULL DEFAULT 'HIGH';

-- DropTable
DROP TABLE "Tier";
