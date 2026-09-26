-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "baseFare" INTEGER,
ADD COLUMN     "bookingFee" INTEGER,
ADD COLUMN     "distanceFare" INTEGER,
ADD COLUMN     "surgeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "timeFare" INTEGER;

-- CreateTable
CREATE TABLE "PricingTier" (
    "tier" TEXT NOT NULL,
    "baseFare" INTEGER NOT NULL,
    "perKm" INTEGER NOT NULL,
    "perMinute" INTEGER NOT NULL,
    "minimumFare" INTEGER NOT NULL,
    "bookingFee" INTEGER NOT NULL DEFAULT 0,
    "surgeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "surgeNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingTier_pkey" PRIMARY KEY ("tier")
);

-- CreateTable
CREATE TABLE "PricingChange" (
    "id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PricingChange_tier_createdAt_idx" ON "PricingChange"("tier", "createdAt");

-- AddForeignKey
ALTER TABLE "PricingChange" ADD CONSTRAINT "PricingChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Starting rates = the previously hard-coded prices, so existing fares don't change.
-- Per-minute, minimum fare and booking fee are set in /admin/pricing.
INSERT INTO "PricingTier" ("tier", "baseFare", "perKm", "perMinute", "minimumFare", "bookingFee", "surgeMultiplier", "updatedAt") VALUES
  ('SWIFT_X',       500, 200, 0, 500, 0, 1, CURRENT_TIMESTAMP),
  ('SWIFT_COMFORT', 700, 300, 0, 700, 0, 1, CURRENT_TIMESTAMP),
  ('SWIFT_XL',      900, 400, 0, 900, 0, 1, CURRENT_TIMESTAMP)
ON CONFLICT ("tier") DO NOTHING;
