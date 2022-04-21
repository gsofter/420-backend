import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import * as jwt from "jsonwebtoken";
import { BigNumber } from 'ethers';

@Injectable()
export class UserService {
  // Buffer (in milliseconds) for signature validity allowance check.
  private timestampBuffer = 300000;
  private logger = new Logger('UserService');

  constructor(private configService: ConfigService) {}

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
      algorithm: "HS256",
      issuer: "420 Game",
      expiresIn: "1d",
    });
  };
  
  jwtDecodeUser(token: string) {
    const jwtPassPhrase = this.configService.get<string>('jwt.passPhrase');
    return jwt.verify(token, jwtPassPhrase, {
      algorithms: ["HS256"],
      issuer: "420 Game",
    });
  };
  
}
