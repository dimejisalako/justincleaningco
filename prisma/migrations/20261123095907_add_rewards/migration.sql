-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "source" TEXT NOT NULL DEFAULT 'auto',
    "earnedOn" DATETIME NOT NULL,
    "earnedFromBookingId" TEXT,
    "redeemedBookingId" TEXT,
    "redeemedAt" DATETIME,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "confirmationCode" TEXT NOT NULL,
    "isRewardVisit" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "planId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "sqftTier" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "deepClean" BOOLEAN NOT NULL DEFAULT false,
    "addons" TEXT NOT NULL DEFAULT '[]',
    "scheduledFor" DATETIME NOT NULL,
    "timeWindow" TEXT NOT NULL,
    "accessNotes" TEXT NOT NULL DEFAULT '',
    "smsConsent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "priceCents" INTEGER NOT NULL,
    "isCustomQuote" BOOLEAN NOT NULL DEFAULT false,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("accessNotes", "addons", "addressLine1", "city", "confirmationCode", "createdAt", "deepClean", "email", "frequency", "id", "isCustomQuote", "name", "paymentStatus", "phone", "planId", "priceCents", "scheduledFor", "smsConsent", "sqftTier", "status", "timeWindow", "updatedAt", "userId", "zip") SELECT "accessNotes", "addons", "addressLine1", "city", "confirmationCode", "createdAt", "deepClean", "email", "frequency", "id", "isCustomQuote", "name", "paymentStatus", "phone", "planId", "priceCents", "scheduledFor", "smsConsent", "sqftTier", "status", "timeWindow", "updatedAt", "userId", "zip" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_confirmationCode_key" ON "Booking"("confirmationCode");
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_scheduledFor_idx" ON "Booking"("scheduledFor");
CREATE INDEX "Booking_email_idx" ON "Booking"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Reward_earnedFromBookingId_key" ON "Reward"("earnedFromBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_redeemedBookingId_key" ON "Reward"("redeemedBookingId");

-- CreateIndex
CREATE INDEX "Reward_userId_idx" ON "Reward"("userId");
