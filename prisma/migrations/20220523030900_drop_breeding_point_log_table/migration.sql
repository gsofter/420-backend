/*
  Warnings:

  - You are about to drop the `BreedingPointLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BreedingPointLog" DROP CONSTRAINT "BreedingPointLog_userAddress_fkey";

-- DropTable
DROP TABLE "BreedingPointLog";
