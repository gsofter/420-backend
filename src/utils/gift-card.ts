import { GiftAmount } from '@prisma/client';

export const GiftAmounts = ['USD50', 'USD100', 'USD200', 'USD420', 'USD1000', 'USD5000', 'USD10000'] as const;

const giftCardTypes: Record<GiftAmount, number> = {
  [GiftAmount.USD50]: 0,
  [GiftAmount.USD100]: 1,
  [GiftAmount.USD200]: 2,
  [GiftAmount.USD420]: 3,
  [GiftAmount.USD1000]: 4,
  [GiftAmount.USD5000]: 5,
  [GiftAmount.USD10000]: 6,
};

export const getGiftCardTypeId = (value: GiftAmount) => {
  const typeId = giftCardTypes[value];
  if (!isNaN(typeId) && typeId >= 0) {
    return typeId;
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
