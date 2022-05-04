/*
  Warnings:

  - Added the required column `proof` to the `Gen1MintRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Gen1MintRequest" ADD COLUMN     "proof" VARCHAR NOT NULL;
