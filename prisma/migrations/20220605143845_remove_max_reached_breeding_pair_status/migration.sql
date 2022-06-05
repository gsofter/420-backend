/*
  Warnings:

  - The values [MAX_REACHED] on the enum `BreedPairStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BreedPairStatus_new" AS ENUM ('PAIRED', 'COMPLETED', 'CANCELED', 'FAILED');
ALTER TABLE "BreedPair" ALTER COLUMN "status" TYPE "BreedPairStatus_new" USING ("status"::text::"BreedPairStatus_new");
ALTER TYPE "BreedPairStatus" RENAME TO "BreedPairStatus_old";
ALTER TYPE "BreedPairStatus_new" RENAME TO "BreedPairStatus";
DROP TYPE "BreedPairStatus_old";
COMMIT;
