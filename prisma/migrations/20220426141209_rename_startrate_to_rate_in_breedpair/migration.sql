/*
  Warnings:

  - You are about to drop the column `startRate` on the `BreedPair` table. All the data in the column will be lost.
  - Added the required column `rate` to the `BreedPair` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BreedPair" DROP COLUMN "startRate",
ADD COLUMN     "rate" INTEGER NOT NULL;
