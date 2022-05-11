/*
  Warnings:

  - Added the required column `issuedAt` to the `Gen1Bud` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signature` to the `Gen1Bud` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Gen1Bud" ADD COLUMN     "issuedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "signature" TEXT NOT NULL;
