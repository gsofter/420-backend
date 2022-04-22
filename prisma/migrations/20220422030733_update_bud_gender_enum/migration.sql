/*
  Warnings:

  - The values [Male,Female] on the enum `BudGender` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BudGender_new" AS ENUM ('M', 'F');
ALTER TABLE "BreedBud" ALTER COLUMN "gender" TYPE "BudGender_new" USING ("gender"::text::"BudGender_new");
ALTER TYPE "BudGender" RENAME TO "BudGender_old";
ALTER TYPE "BudGender_new" RENAME TO "BudGender";
DROP TYPE "BudGender_old";
COMMIT;
