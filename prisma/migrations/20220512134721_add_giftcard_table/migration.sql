-- CreateEnum
CREATE TYPE "GiftAmount" AS ENUM ('USD100', 'USD200', 'USD420', 'USD1000');

-- CreateTable
CREATE TABLE "GiftCard" (
    "id" SERIAL NOT NULL,
    "value" "GiftAmount" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "minterAddress" TEXT NOT NULL,
    "signature" TEXT NOT NULL,

    CONSTRAINT "GiftCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GiftCard_minterAddress_id_idx" ON "GiftCard"("minterAddress", "id");

-- CreateIndex
CREATE INDEX "GiftCard_value_idx" ON "GiftCard"("value");
