/*
  Warnings:

  - Added the required column `minterAddress` to the `Gen1Bud` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Gen1Bud" ADD COLUMN     "minterAddress" TEXT NOT NULL;
