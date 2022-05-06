-- CreateTable
CREATE TABLE "BreedSlot" (
    "id" SERIAL NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "type" "BreedSlotType" NOT NULL DEFAULT E'OUTDOOR',
    "pairId" INTEGER,
    "gameKeyTokenId" INTEGER,
    "landTokenId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAddress" VARCHAR(42) NOT NULL,

    CONSTRAINT "BreedSlot_pkey" PRIMARY KEY ("id")
);
