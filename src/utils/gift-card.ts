import { GiftAmount } from '@prisma/client';

const giftCardTypes: Record<GiftAmount, number> = {
  [GiftAmount.USD_100]: 0,
  [GiftAmount.USD_200]: 1,
  [GiftAmount.USD_420]: 2,
  [GiftAmount.USD_1000]: 3,
};

export const getGiftCardTypeId = (value: GiftAmount) => {
  if (giftCardTypes[value]) {
    return giftCardTypes[value];
  }

  return -1;
};

export const getGiftCardSupply = (value: GiftAmount) => {
  if (value === GiftAmount.USD_100) {
    return 200;
  }
  if (value === GiftAmount.USD_200) {
    return 65;
  }
  if (value === GiftAmount.USD_420) {
    return 22;
  }
  if (value === GiftAmount.USD_1000) {
    return 10;
  }
  return 0;
};
