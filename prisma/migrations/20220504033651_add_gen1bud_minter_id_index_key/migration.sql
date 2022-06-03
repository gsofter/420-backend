-- DropIndex
DROP INDEX "Gen1Bud_id_thc_idx";

-- CreateIndex
CREATE INDEX "Gen1Bud_minterAddress_id_idx" ON "Gen1Bud"("minterAddress", "id");
