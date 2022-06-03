/*
  Warnings:

  - A unique constraint covering the columns `[maleBudId,femaleBudId,status]` on the table `BreedPair` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BreedPair_maleBudId_femaleBudId_key";

-- CreateIndex
CREATE UNIQUE INDEX "BreedPair_maleBudId_femaleBudId_status_key" ON "BreedPair"("maleBudId", "femaleBudId", "status");
