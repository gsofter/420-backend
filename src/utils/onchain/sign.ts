import { ethers, utils } from 'ethers';
import { solidityKeccak256 } from 'ethers/lib/utils';

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
  typeString: "Gen1Bud" | "Land" | "Ticket" | "GameItem" | "ConvertBP2HIGH",
  tokenId: number,
  amount: number,
  timestamp: number,
): Promise<string | null> => {
  const WALLET_PRIVATE_KEY = process.env.ISSUER_PRIVATE_KEY;

  if (!WALLET_PRIVATE_KEY) {
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
