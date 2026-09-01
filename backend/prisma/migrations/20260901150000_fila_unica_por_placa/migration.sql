-- DropIndex
DROP INDEX "waitlist_entries_sectorId_plate_key";

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_plate_key" ON "waitlist_entries"("plate");

