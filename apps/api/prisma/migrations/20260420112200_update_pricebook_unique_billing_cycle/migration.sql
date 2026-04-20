-- DropIndex
DROP INDEX IF EXISTS "price_books_planId_tier_currencyCode_status_key";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "price_books_planId_tier_currencyCode_billingCycle_status_idx" ON "price_books"("planId", "tier", "currencyCode", "billingCycle", "status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "price_books_planId_tier_currencyCode_billingCycle_status_key" ON "price_books"("planId", "tier", "currencyCode", "billingCycle", "status");
