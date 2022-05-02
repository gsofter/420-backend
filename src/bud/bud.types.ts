import { Bud } from "src/types";

export type DiceGen1BudResponse = {
  success: boolean;
  data: Bud
};

export type VerifyBudsOptions = {
  checkMetadata?: boolean;
}

export type VerifyBudPair = {
  maleBudId: number;
  femaleBudId: number;
  address: string;
};
