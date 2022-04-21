import { getAddress } from 'ethers/lib/utils';

export const checksumAddress = (address: string) => {
  try {
    return getAddress(address.toLowerCase());
  } catch {}

  return address;
};
