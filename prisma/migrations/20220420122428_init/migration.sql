-- CreateEnum
CREATE TYPE "BudGender" AS ENUM ('Male', 'Female');

-- CreateEnum
CREATE TYPE "BudColor" AS ENUM ('Light', 'Medium', 'Dark');

-- CreateEnum
CREATE TYPE "BudShine" AS ENUM ('Yes', 'No');

-- CreateTable
CREATE TABLE "User" (
    "address" VARCHAR(42) NOT NULL,
    "signature" TEXT NOT NULL,
    "r" TEXT NOT NULL,
    "s" TEXT NOT NULL,
    "v" SMALLINT NOT NULL,
    "gameKeyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "BreedPair" (
    "id" SERIAL NOT NULL,
    "maleBudId" INTEGER NOT NULL,
    "femaleBudId" INTEGER NOT NULL,
    "startRate" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAddress" VARCHAR(42) NOT NULL,

    CONSTRAINT "BreedPair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreedLevel" (
    "id" SERIAL NOT NULL,
    "pairId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreedLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreedBud" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "image" VARCHAR NOT NULL,
    "thc" INTEGER NOT NULL,
    "gen" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "gender" "BudGender" NOT NULL,
    "shine" "BudShine" NOT NULL,
    "color" "BudColor" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "levelId" INTEGER NOT NULL,

    CONSTRAINT "BreedBud_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BreedBud_id_thc_idx" ON "BreedBud"("id", "thc");

-- AddForeignKey
ALTER TABLE "BreedPair" ADD CONSTRAINT "BreedPair_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreedBud" ADD CONSTRAINT "BreedBud_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "BreedLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
