import { GameItem } from 'src/types';

export type BonusRateStatus = 'positive' | 'neutral' | 'negative';

/**
 * Returns the bonus rate status of a given rate number.
 *
 * @param rate rate number
 * @returns BonusRateStatus
 */
export const getBonusRateStatus = (rate: number): BonusRateStatus => {
  if (rate === 0) return 'neutral';

  return rate > 0 ? 'positive' : 'negative';
};

export const getBreedTime = (baseTime: number, gameItemId?: number) => {
  if (gameItemId === GameItem.FARMER_PASS) {
    return Math.floor((1 * baseTime) / 2);
  } else if (gameItemId === GameItem.SUPERWEED_SERUM) {
    return Math.floor((4 * baseTime) / 5);
  }

  return baseTime;
};
