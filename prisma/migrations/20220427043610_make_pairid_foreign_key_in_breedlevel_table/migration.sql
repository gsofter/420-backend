-- AddForeignKey
ALTER TABLE "BreedLevel" ADD CONSTRAINT "BreedLevel_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "BreedPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
