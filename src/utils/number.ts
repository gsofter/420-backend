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
