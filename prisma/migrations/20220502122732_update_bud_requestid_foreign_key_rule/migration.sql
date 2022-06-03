/*
  Warnings:

  - A unique constraint covering the columns `[requestId]` on the table `Gen1Bud` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pairId` to the `Gen1Bud` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Gen1Bud" ADD COLUMN     "pairId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Gen1Bud_requestId_key" ON "Gen1Bud"("requestId");
