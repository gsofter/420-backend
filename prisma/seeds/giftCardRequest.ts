import crypto from "crypto";
import { BigNumber, ethers } from "ethers";

const LENGTH = 32;
const supplyCaps = [600, 200, 125, 90, 50, 15, 2];

const generateRequestIds = (): string[] => {
  const _generateRandomId = (id: number): string => {
    const hex = crypto.randomBytes(LENGTH).toString("hex");
    const value = BigNumber.from(hex).mul(4).add(id);
    return ethers.utils.hexZeroPad(value.toHexString(), 32);
  };

  const _generateIds = (amount: number, id: number): string[] => {
    const result = [];

    for (let i = 0; i < amount; i++) {
      result.push(_generateRandomId(id));
    }

    return result;
  };

  const ids = supplyCaps.reduce(
    (total: string[], amount: number, id: number) => [...total, ..._generateIds(amount, id)],
    [],
  );

  return ids;
};

export default generateRequestIds;
