/*
  Warnings:

  - You are about to drop the column `size` on the `BreedBud` table. All the data in the column will be lost.
  - Added the required column `budSize` to the `BreedBud` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BreedBud" DROP COLUMN "size",
ADD COLUMN     "budSize" INTEGER NOT NULL;
