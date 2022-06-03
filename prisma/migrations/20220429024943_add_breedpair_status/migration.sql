/*
  Warnings:

  - Added the required column `status` to the `BreedPair` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BreedPairStatus" AS ENUM ('PAIRED', 'COMPLETED');

-- AlterTable
ALTER TABLE "BreedPair" ADD COLUMN     "status" "BreedPairStatus" NOT NULL;
