-- DropIndex
DROP INDEX "waitlist_entries_sectorId_position_idx";

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_sectorId_position_key" ON "waitlist_entries"("sectorId", "position");

