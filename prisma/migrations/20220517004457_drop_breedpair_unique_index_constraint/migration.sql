-- DropIndex
DROP INDEX "BreedPair_maleBudId_femaleBudId_status_key";

-- CreateIndex
CREATE INDEX "BreedPair_id_userAddress_status_idx" ON "BreedPair"("id", "userAddress", "status");
