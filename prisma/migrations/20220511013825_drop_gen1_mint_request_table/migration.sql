/*
  Warnings:

  - You are about to drop the column `requestId` on the `Gen1Bud` table. All the data in the column will be lost.
  - You are about to drop the `Gen1MintRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Gen1Bud" DROP CONSTRAINT "Gen1Bud_requestId_fkey";

-- DropIndex
DROP INDEX "Gen1Bud_requestId_idx";

-- DropIndex
DROP INDEX "Gen1Bud_requestId_key";

-- AlterTable
ALTER TABLE "Gen1Bud" DROP COLUMN "requestId";

-- DropTable
DROP TABLE "Gen1MintRequest";
