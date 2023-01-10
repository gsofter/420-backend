-- CreateTable
CREATE TABLE "Stats" (
    "id" SERIAL NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "totalSuccess" INTEGER NOT NULL,
    "totalFailure" INTEGER NOT NULL,
    "totalCancels" INTEGER NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "bpForBreeding" INTEGER NOT NULL,
    "bpForLandUpgrade" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stats_address_key" ON "Stats"("address");
