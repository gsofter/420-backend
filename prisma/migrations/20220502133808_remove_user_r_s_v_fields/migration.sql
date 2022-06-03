/*
  Warnings:

  - You are about to drop the column `r` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `s` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `v` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "r",
DROP COLUMN "s",
DROP COLUMN "v";
