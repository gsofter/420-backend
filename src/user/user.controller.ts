import { BreedingPointDto } from './dto/breeding-point.dto';
import { Body, Controller, Logger, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { splitSignature, verifyMessage } from 'ethers/lib/utils';
import type { Request } from 'src/types';
import { BadRequestError, NotFoundError } from 'src/utils/errors';
import { LoginDto } from './dto/login.dto';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('users')
export class UserController {
  private readonly logger = new Logger('UserController');

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

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

  @UseGuards(AuthGuard('admin'))
  @Put('breeding-point')
  async addBreedingPoint(@Body() body: BreedingPointDto) {
    const { address, txHash, block, network, amount } = body;

    if (network !== this.configService.get<string>('network.name')) {
      throw BadRequestError('Invalid network');
    }

    const user = await this.prismaService.user.findUnique({
      where: { address },
    });

    if (!user) {
      throw NotFoundError('User not found.');
    }

    try {
      // TODO: Verify txHash and actual event
      await this.prismaService.user.update({
        where: { address },
        data: {
          breedingPoint: user.breedingPoint + amount,
        },
      });

      await this.prismaService.breedingPointLog.create({
        data: {
          userAddress: address,
          txHash,
          block,
          amount,
        },
      });

      return {
        success: true
      }
    } catch (e) {
      this.logger.error('addBreedingPoint: ' + e.message);
    }

    return {
      success: false
    }
  }
}
