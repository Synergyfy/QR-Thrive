-- Add unique constraint to price_books
CREATE UNIQUE INDEX "price_books_planId_tier_currencyCode_status_key" ON "price_books"("planId", "tier", "currencyCode", "status");