-- CreateTable
CREATE TABLE "BreedingPointLog" (
    "id" SERIAL NOT NULL,
    "userAddress" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "block" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreedingPointLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BreedingPointLog" ADD CONSTRAINT "BreedingPointLog_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
