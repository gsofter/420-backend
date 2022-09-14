import { ethers, utils } from 'ethers';
import { solidityKeccak256 } from 'ethers/lib/utils';
import * as fs from 'fs';

export const readWalletPrivateKey = () => {
  // path is coming from here; https://github.com/looklabs/420-backend/blob/dev/.ebextensions/01secrets.config#L15
  const path = '/run/wallet-key';
  try {
    const buffer = fs.readFileSync(path);

    return buffer.toString();
  } catch (e) {
    console.error(`Read ISSUER_PRIVATE_KEY from ${path} failed`, e);
    return null;
  }
};

const issuerWalletPrivateKey = readWalletPrivateKey();

/**
 * Signs a mint request to specific address with given tokenId.
 * If ISSUER_PRIVATE_KEY is not set or there is an error, this returns the null.
 * If successful, it will return the signature along with the timestamp of when the signature is generated.
 *
 * @param address string
 * @param tokenId number
 * @param timestamp number
 * @returns Promise<{timestamp: number, signature: string} | null>
 */
export const signMintRequest = async (
  address: string,
  typeString: 'Gen1Bud' | 'Land' | 'Ticket' | 'GameItem' | 'ConvertBP2HIGH',
  tokenId: number,
  amount: number,
  timestamp: number,
): Promise<string | null> => {
  const WALLET_PRIVATE_KEY = issuerWalletPrivateKey || process.env.ISSUER_PRIVATE_KEY;

  if (!WALLET_PRIVATE_KEY) {
    console.error(`WALLET_PRIVATE_KEY is not provided`);
    return null;
  }

  try {
    const issuerWallet = new ethers.Wallet(WALLET_PRIVATE_KEY);

    const signature = await issuerWallet.signMessage(
      Buffer.from(
        solidityKeccak256(
          ['address', 'bytes32', 'uint256', 'uint256', 'uint256'],
          [address, utils.id(typeString), tokenId, amount, timestamp],
        ).slice(2),
        'hex',
      ),
    );

    return signature;
  } catch {}

  return null;
};
