/*
  Warnings:

  - You are about to drop the column `pairId` on the `BreedSlot` table. All the data in the column will be lost.
  - Added the required column `slotId` to the `BreedPair` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BreedPair" ADD COLUMN     "slotId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "BreedSlot" DROP COLUMN "pairId";
