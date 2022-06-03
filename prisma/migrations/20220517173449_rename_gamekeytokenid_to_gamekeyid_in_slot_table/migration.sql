/*
  Warnings:

  - You are about to drop the column `gameKeyTokenId` on the `BreedSlot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BreedSlot" DROP COLUMN "gameKeyTokenId",
ADD COLUMN     "gameKeyId" INTEGER;
