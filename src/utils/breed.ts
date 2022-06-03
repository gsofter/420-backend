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
