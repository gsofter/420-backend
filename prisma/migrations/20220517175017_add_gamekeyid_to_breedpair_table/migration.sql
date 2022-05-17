/*
  Warnings:

  - Added the required column `gameKeyId` to the `BreedPair` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BreedPair" ADD COLUMN     "gameKeyId" INTEGER NOT NULL;
