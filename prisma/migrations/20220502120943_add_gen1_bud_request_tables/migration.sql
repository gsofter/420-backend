-- CreateTable
CREATE TABLE "Gen1MintRequest" (
    "id" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "Gen1Bud" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "image" VARCHAR NOT NULL,
    "thc" INTEGER NOT NULL,
    "budSize" INTEGER NOT NULL,
    "gender" "BudGender" NOT NULL,
    "shine" "BudShine" NOT NULL,
    "color" "BudColor" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestId" TEXT NOT NULL,

    CONSTRAINT "Gen1Bud_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gen1MintRequest_id_key" ON "Gen1MintRequest"("id");

-- CreateIndex
CREATE INDEX "Gen1Bud_id_thc_idx" ON "Gen1Bud"("id", "thc");

-- CreateIndex
CREATE INDEX "Gen1Bud_requestId_idx" ON "Gen1Bud"("requestId");

-- AddForeignKey
ALTER TABLE "Gen1Bud" ADD CONSTRAINT "Gen1Bud_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Gen1MintRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
