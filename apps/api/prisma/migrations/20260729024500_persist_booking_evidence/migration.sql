ALTER TABLE "Booking"
ADD COLUMN "evidenceHash" TEXT NOT NULL DEFAULT repeat('0', 64),
ADD COLUMN "checkInProofHash" TEXT;

ALTER TABLE "Booking"
ALTER COLUMN "evidenceHash" DROP DEFAULT;
