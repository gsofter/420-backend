-- CreateEnum
CREATE TYPE "BreedSlotType" AS ENUM ('INDOOR', 'OUTDOOR');

-- AlterTable
ALTER TABLE "Gen1MintRequest" ALTER COLUMN "id" SET DATA TYPE VARCHAR(64);
