/*
  Warnings:

  - A unique constraint covering the columns `[pairId,level]` on the table `BreedLevel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[maleBudId,femaleBudId]` on the table `BreedPair` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[address]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "breedingPoint" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "BreedBud_levelId_idx" ON "BreedBud"("levelId");

-- CreateIndex
CREATE INDEX "BreedLevel_pairId_level_idx" ON "BreedLevel"("pairId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "BreedLevel_pairId_level_key" ON "BreedLevel"("pairId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "BreedPair_maleBudId_femaleBudId_key" ON "BreedPair"("maleBudId", "femaleBudId");

-- CreateIndex
CREATE INDEX "User_address_idx" ON "User"("address");

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");
