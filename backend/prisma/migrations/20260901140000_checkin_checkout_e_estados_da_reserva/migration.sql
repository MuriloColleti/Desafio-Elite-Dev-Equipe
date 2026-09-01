-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReservationEventType" ADD VALUE 'CHECKED_IN';
ALTER TYPE "ReservationEventType" ADD VALUE 'CHECKED_OUT';

-- AlterEnum
BEGIN;
CREATE TYPE "ReservationStatus_new" AS ENUM ('AGENDADO', 'EM_USO', 'CONCLUIDO', 'CANCELADO');
ALTER TABLE "public"."reservations" ALTER COLUMN "status" DROP DEFAULT;
-- Traduz os estados da migration anterior antes do cast: ACTIVE virou AGENDADO
-- e CANCELLED virou CANCELADO. Sem isto o USING abaixo falha em bancos que ja
-- tenham reservas criadas.
ALTER TABLE "reservations" ALTER COLUMN "status" TYPE TEXT;
UPDATE "reservations" SET "status" = 'AGENDADO' WHERE "status" = 'ACTIVE';
UPDATE "reservations" SET "status" = 'CANCELADO' WHERE "status" = 'CANCELLED';
ALTER TABLE "reservations" ALTER COLUMN "status" TYPE "ReservationStatus_new" USING ("status"::"ReservationStatus_new");
ALTER TYPE "ReservationStatus" RENAME TO "ReservationStatus_old";
ALTER TYPE "ReservationStatus_new" RENAME TO "ReservationStatus";
DROP TYPE "public"."ReservationStatus_old";
ALTER TABLE "reservations" ALTER COLUMN "status" SET DEFAULT 'AGENDADO';
COMMIT;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "checkedOutAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'AGENDADO';

