/*
  Warnings:

  - A unique constraint covering the columns `[slotId]` on the table `BreedPair` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BreedPair_slotId_key" ON "BreedPair"("slotId");

-- AddForeignKey
ALTER TABLE "BreedPair" ADD CONSTRAINT "BreedPair_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "BreedSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
