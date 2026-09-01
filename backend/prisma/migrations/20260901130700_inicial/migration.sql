-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationEventType" AS ENUM ('CREATED', 'CANCELLED', 'WAITLIST_JOINED', 'WAITLIST_LEFT', 'WAITLIST_PROMOTED');

-- CreateTable
CREATE TABLE "sectors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "quota" INTEGER NOT NULL,
    "hourlyRate" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "expectedAt" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "expectedAt" TIMESTAMP(3) NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_events" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" "ReservationEventType" NOT NULL,
    "detail" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reservations_sectorId_idx" ON "reservations"("sectorId");

-- CreateIndex
CREATE INDEX "reservations_plate_idx" ON "reservations"("plate");

-- CreateIndex
CREATE INDEX "reservations_sectorId_status_idx" ON "reservations"("sectorId", "status");

-- CreateIndex
CREATE INDEX "waitlist_entries_sectorId_position_idx" ON "waitlist_entries"("sectorId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_sectorId_plate_key" ON "waitlist_entries"("sectorId", "plate");

-- CreateIndex
CREATE INDEX "reservation_events_reservationId_occurredAt_idx" ON "reservation_events"("reservationId", "occurredAt");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_events" ADD CONSTRAINT "reservation_events_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
