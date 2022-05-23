-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BURN_GEN0', 'MINT_LAND', 'DEPOSIT_BP');

-- CreateTable
CREATE TABLE "EventServiceLog" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "type" "EventType" NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventServiceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventServiceLog_txHash_key" ON "EventServiceLog"("txHash");
