require('dotenv-flow').config();

import * as crypto from 'crypto';
import { keccak256 } from 'ethers/lib/utils';
import MerkleTree from 'merkletreejs';

console.log(`Running on ${process.env.NETWORK} \n`);

const LENGTH = 16;
const TOTAL_SUPPLY = process.env.NETWORK === 'mainnet' ? 30 * 1000 : 30;

const generateMerkleTree = (ids: string[]): MerkleTree => {
  const tree = new MerkleTree(ids, keccak256, {
    sortPairs: true,
  });

  return tree;
};

const generateRequestIds = () => {
  const _generateRandomId = (): string => {
    const hex = crypto.randomBytes(LENGTH).toString('hex');

    return hex;
  };

  const _generateIds = (amount: number): string[] => {
    const result = [];
    const duplicates: Record<string, boolean> = {};

    for (let i = 0; i < amount; i++) {
      const id = _generateRandomId();

      if (duplicates[id]) {
        i--;
        continue;
      } else {
        duplicates[id] = true;
        result.push(id);
      }
    }

    return result;
  };

  const ids = _generateIds(TOTAL_SUPPLY);
  const tree = generateMerkleTree(ids);

  const leaves: Array<{id: string, proof: string}> = [];
  for (const id of ids) {
    leaves.push({
      id,
      proof: tree.getHexProof(id).join(","),
    })
  }

  console.log(`Gen1MintRequest Merkle root: ${tree.getHexRoot()}`);

  return leaves;
};

export default generateRequestIds;
