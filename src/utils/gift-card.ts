import { GiftAmount } from '@prisma/client';

export const GiftAmounts = ['USD100', 'USD200', 'USD420', 'USD1000'] as const;

const giftCardTypes: Record<GiftAmount, number> = {
  [GiftAmount.USD100]: 0,
  [GiftAmount.USD200]: 1,
  [GiftAmount.USD420]: 2,
  [GiftAmount.USD1000]: 3,
};

export const getGiftCardTypeId = (value: GiftAmount) => {
  if (giftCardTypes[value]) {
    return giftCardTypes[value];
  }

  return -1;
};

export const getGiftCardSupply = (value: GiftAmount) => {
  if (value === GiftAmount.USD100) {
    return 200;
  }
  if (value === GiftAmount.USD200) {
    return 65;
  }
  if (value === GiftAmount.USD420) {
    return 22;
  }
  if (value === GiftAmount.USD1000) {
    return 10;
  }
  return 0;
};
