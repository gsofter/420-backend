import { Body, Controller, Post, Req } from '@nestjs/common';
import { splitSignature, verifyMessage } from 'ethers/lib/utils';
import type { Request } from 'src/types';
import { BadRequestError } from 'src/utils/errors';
import { LoginDto } from './dto/login.dto';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService, private readonly prismaService: PrismaService ) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const { message, signature, address, gameKeyId } = body;
    const gameKey = Number(gameKeyId);

    if (!this.userService.isValidMessage(gameKey, message)) {
      throw BadRequestError('Invalid message and/or timestamp.');
    }

    const derivedAddress = verifyMessage(message, signature);

    if (derivedAddress === address) {
      const { r, s, v } = splitSignature(signature);

      const user = await this.prismaService.user.upsert({
        create: {
          address: address,
          signature: signature,
          r,
          s,
          v,
          gameKeyId: gameKey,
        },
        update: {
          signature: signature,
          r,
          s,
          v,
          gameKeyId: gameKey,
        },
        where: { address: address },
      });

      return {
        address: user.address,
        token: this.userService.jwtEncodeUser(user.address, gameKey),
      };
    }

    throw BadRequestError('Signature and Address do not match.');
  }
}
