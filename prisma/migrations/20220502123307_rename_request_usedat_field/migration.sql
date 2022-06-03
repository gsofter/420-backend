/*
  Warnings:

  - You are about to drop the column `usedAt` on the `Gen1MintRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Gen1MintRequest" DROP COLUMN "usedAt",
ADD COLUMN     "requestedAt" TIMESTAMP(3);
