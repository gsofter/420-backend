import { Network } from './types';

export const ADDRESSES = {
  rinkeby: {
    MULTICALL: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
    BUD: '0x7A82634C555c00c437FFCC910716b933F74eF4B4',
  },
  mainnet: {
    MULTICALL: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696', // https://github.com/makerdao/multicall#multicall2-contract-addresses,
    BUD: '0xebbd75122a9e292b5205d9a374b5ea2c1933f903',
  },
} as const;
