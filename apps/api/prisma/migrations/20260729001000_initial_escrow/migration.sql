-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_FUNDING', 'FUNDED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'RENTER_NO_SHOW', 'HOST_NO_SHOW', 'DISPUTED', 'REFUNDED', 'RELEASED', 'SPLIT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TransactionKind" AS ENUM ('FUND', 'REFUND', 'RELEASE', 'SPLIT');

-- CreateTable
CREATE TABLE "WalletIdentity" (
    "id" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthChallenge" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "nonceHash" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostApplication" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "statement" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "hostId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "addressHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewingSlot" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViewingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" UUID NOT NULL,
    "onChainBookingId" TEXT NOT NULL,
    "propertyId" UUID NOT NULL,
    "slotId" UUID NOT NULL,
    "renterId" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "depositAmount" BIGINT NOT NULL,
    "asset" TEXT NOT NULL,
    "visitTime" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_FUNDING',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingStatusHistory" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "from" "BookingStatus",
    "to" "BookingStatus" NOT NULL,
    "actor" TEXT NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "kind" "TransactionKind" NOT NULL,
    "amount" BIGINT NOT NULL,
    "ledger" INTEGER NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInChallenge" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "nonceHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckInChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInAttempt" (
    "id" UUID NOT NULL,
    "challengeId" UUID NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "proofHash" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckInAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceFile" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "objectKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "openedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceHash" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeResponse" (
    "id" UUID NOT NULL,
    "disputeId" UUID NOT NULL,
    "responder" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "evidenceHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeResolution" (
    "id" UUID NOT NULL,
    "disputeId" UUID NOT NULL,
    "arbitrator" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "renterAmount" BIGINT NOT NULL,
    "hostAmount" BIGINT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" UUID NOT NULL,
    "walletId" UUID,
    "rating" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSyncCursor" (
    "id" UUID NOT NULL,
    "contractId" TEXT NOT NULL,
    "ledger" INTEGER NOT NULL,
    "pagingToken" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractSyncCursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletIdentity_address_key" ON "WalletIdentity"("address");

-- CreateIndex
CREATE UNIQUE INDEX "AuthChallenge_nonceHash_key" ON "AuthChallenge"("nonceHash");

-- CreateIndex
CREATE INDEX "AuthChallenge_walletId_expiresAt_idx" ON "AuthChallenge"("walletId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");

-- CreateIndex
CREATE INDEX "UserSession_walletId_expiresAt_idx" ON "UserSession"("walletId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_walletId_key" ON "UserProfile"("walletId");

-- CreateIndex
CREATE INDEX "HostApplication_status_createdAt_idx" ON "HostApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "HostApplication_walletId_status_idx" ON "HostApplication"("walletId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_hostId_active_idx" ON "Property"("hostId", "active");

-- CreateIndex
CREATE INDEX "Property_district_active_idx" ON "Property"("district", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyImage_propertyId_position_key" ON "PropertyImage"("propertyId", "position");

-- CreateIndex
CREATE INDEX "ViewingSlot_propertyId_startsAt_lockedUntil_idx" ON "ViewingSlot"("propertyId", "startsAt", "lockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "ViewingSlot_propertyId_startsAt_key" ON "ViewingSlot"("propertyId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_onChainBookingId_key" ON "Booking"("onChainBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_slotId_key" ON "Booking"("slotId");

-- CreateIndex
CREATE INDEX "Booking_status_visitTime_idx" ON "Booking"("status", "visitTime");

-- CreateIndex
CREATE INDEX "Booking_renterId_status_idx" ON "Booking"("renterId", "status");

-- CreateIndex
CREATE INDEX "Booking_hostId_status_idx" ON "Booking"("hostId", "status");

-- CreateIndex
CREATE INDEX "Booking_propertyId_visitTime_idx" ON "Booking"("propertyId", "visitTime");

-- CreateIndex
CREATE INDEX "BookingStatusHistory_bookingId_createdAt_idx" ON "BookingStatusHistory"("bookingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_hash_key" ON "PaymentTransaction"("hash");

-- CreateIndex
CREATE INDEX "PaymentTransaction_bookingId_kind_idx" ON "PaymentTransaction"("bookingId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInChallenge_nonceHash_key" ON "CheckInChallenge"("nonceHash");

-- CreateIndex
CREATE INDEX "CheckInChallenge_bookingId_expiresAt_idx" ON "CheckInChallenge"("bookingId", "expiresAt");

-- CreateIndex
CREATE INDEX "CheckInAttempt_challengeId_createdAt_idx" ON "CheckInAttempt"("challengeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceFile_objectKey_key" ON "EvidenceFile"("objectKey");

-- CreateIndex
CREATE INDEX "EvidenceFile_bookingId_createdAt_idx" ON "EvidenceFile"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "EvidenceFile_expiresAt_idx" ON "EvidenceFile"("expiresAt");

-- CreateIndex
CREATE INDEX "Dispute_bookingId_status_idx" ON "Dispute"("bookingId", "status");

-- CreateIndex
CREATE INDEX "DisputeResponse_disputeId_createdAt_idx" ON "DisputeResponse"("disputeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeResolution_disputeId_key" ON "DisputeResolution"("disputeId");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeResolution_transactionHash_key" ON "DisputeResolution"("transactionHash");

-- CreateIndex
CREATE INDEX "Notification_walletId_readAt_createdAt_idx" ON "Notification"("walletId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_subjectType_subjectId_createdAt_idx" ON "AuditLog"("subjectType", "subjectId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actor_createdAt_idx" ON "AuditLog"("actor", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContractSyncCursor_contractId_key" ON "ContractSyncCursor"("contractId");

-- AddForeignKey
ALTER TABLE "AuthChallenge" ADD CONSTRAINT "AuthChallenge_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "WalletIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "WalletIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "WalletIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostApplication" ADD CONSTRAINT "HostApplication_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "WalletIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "WalletIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewingSlot" ADD CONSTRAINT "ViewingSlot_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ViewingSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "WalletIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "WalletIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusHistory" ADD CONSTRAINT "BookingStatusHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInChallenge" ADD CONSTRAINT "CheckInChallenge_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInAttempt" ADD CONSTRAINT "CheckInAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "CheckInChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "WalletIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeResponse" ADD CONSTRAINT "DisputeResponse_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeResolution" ADD CONSTRAINT "DisputeResolution_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "WalletIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "WalletIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
