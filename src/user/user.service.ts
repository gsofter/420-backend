import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber, ethers } from 'ethers';
import * as GameKeyAbi from 'src/abis/gameKey.json';
import { PrismaService } from 'src/prisma/prisma.service';
import { BreedingError, UnproceesableEntityError } from 'src/utils/errors';
import { Network } from 'src/types';
import { multicall } from 'src/utils/multicall';
import { ADDRESSES } from 'src/config';

@Injectable()
export class UserService {
  // Buffer (in milliseconds) for signature validity allowance check.
  private timestampBuffer = 300000;
  private logger = new Logger('UserService');
  private rpcProvider: JsonRpcProvider;

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    const rpcUrl = configService.get<string>('network.rpc');
    const chainId = configService.get<number>('network.chainId');

    this.rpcProvider = new ethers.providers.StaticJsonRpcProvider(
      rpcUrl,
      chainId,
    );
  }

  /**
   * Retrieve the message the user will sign to login
   * @param gameKeyId number
   * @param timestamp timestamp (in milliseconds)
   * @returns message
   */
  getLoginMessage(gameKeyId: number, timestamp: string | number = Date.now()) {
    return `Please sign this message to play 420 Game.
This won't cost you any ETH!

If you're connecting a hardware wallet, you'll need to sign the message on your device, too.

GameKey#: ${gameKeyId}
Timestamp: ${timestamp}`;
  }

  /**
   * Validate the signing message
   * @param message message to sign
   * @returns boolean indicating if the message is valid
   */
  isValidMessage(gameKeyId: number, message: string): boolean {
    const now = Date.now();
    const timestamp = message.substring(message.length - 13);

    // Message timestamp is within the timeframe (5 mins).
    if (
      BigNumber.from(now).sub(this.timestampBuffer).lt(timestamp) &&
      BigNumber.from(now).add(this.timestampBuffer).gt(timestamp)
    ) {
      // Message hasn't been modified (e.g.: 3rd-party).
      if (this.getLoginMessage(gameKeyId, timestamp) === message) {
        return true;
      }

      return false;
    }

    return false;
  }

  jwtEncodeUser(address: string, gameKeyId: number) {
    const jwtPassPhrase = this.configService.get<string>('jwt.passPhrase');

    return jwt.sign({ address, gameKeyId }, jwtPassPhrase, {
      algorithm: 'HS256',
      issuer: '420 Game',
      expiresIn: '1d',
    });
  }

  jwtDecodeUser(token: string) {
    const jwtPassPhrase = this.configService.get<string>('jwt.passPhrase');
    return jwt.verify(token, jwtPassPhrase, {
      algorithms: ['HS256'],
      issuer: '420 Game',
    });
  }

  async consumeBreedingPoint(user: string, amount: number) {
    const userObject = await this.prismaService.user.findUnique({
      where: { address: user },
    });

    if (userObject.breedingPoint < amount) {
      throw UnproceesableEntityError('Not enough breeding point');
    }

    return await this.prismaService.user.update({
      where: { address: user },
      data: {
        breedingPoint: userObject.breedingPoint - amount,
      },
    });
  }

  async isGameKeyStaked(gameKeyId: number) {
    const network = this.configService.get<Network>('network.name');

    let [owner] = [''];
    try {
      [owner] = await multicall(
        this.rpcProvider,
        ADDRESSES[network].MULTICALL,
        GameKeyAbi,
        [
          {
            contractAddress: ADDRESSES[network].GAME_KEY,
            functionName: 'ownerOf',
            params: [gameKeyId],
          },
        ],
      );
    } catch (e) {
      this.logger.error('multicall error: ' + e.message, e);
      throw BreedingError('Check game key stake issue.. RPC call error');
    }
    
    return owner === ADDRESSES[network].STAKING;
  }
}
