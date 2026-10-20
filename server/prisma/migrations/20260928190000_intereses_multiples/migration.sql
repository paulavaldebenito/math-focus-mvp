-- AlterTable
ALTER TABLE "ChildProfile" ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill: cada perfil tenía a lo más un interés.
UPDATE "ChildProfile" SET "interests" = ARRAY["interest"] WHERE "interest" IS NOT NULL;

-- AlterTable
ALTER TABLE "ChildProfile" DROP COLUMN "interest";

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "baseKey" TEXT;
