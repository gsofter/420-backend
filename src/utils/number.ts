/**
 * Generate the random number in the range
 * 
 * @param max number
 * @param min number
 * @returns random number
 */
export const randomNumber = (max: number, min = 0) => {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Dice on random chance
 * 
 * @param chance target chance percentage
 * @returns boolean
 */
export const winRandomChance = (chance: number): boolean => {
  if (chance === 100) 
    return true;

  if (chance > 0 && chance < 100) {
    const random = randomNumber(100);
    return random <= chance;
  }

  return false;
}
