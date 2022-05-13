import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { verifyMessage } from 'ethers/lib/utils';
import type { Request } from 'src/types';
import {
  BadRequestError,
  BreedingError,
  NotFoundError,
} from 'src/utils/errors';
import { LoginDto } from './dto/login.dto';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { LandService } from 'src/land/land.service';

@Controller('users')
export class UserController {
  private readonly logger = new Logger('UserController');

  constructor(
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,

    @Inject(forwardRef(() => LandService))
    private readonly landService: LandService,
  ) {}

  @Get('/')
  async getUser(@Req() req: Request) {
    const { user: address } = req;

    const user = await this.prismaService.user.findUnique({
      where: { address },
      select: {
        address: true,
        breedingPoint: true,
        gameKeyId: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw NotFoundError('User not found.');
    }

    return {
      success: true,
      data: user,
    };
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const { message, signature, address, gameKeyId } = body;
    const gameKey = Number(gameKeyId);

    if (!this.userService.isValidMessage(gameKey, message)) {
      throw BadRequestError('Invalid message and/or timestamp.');
    }

    const derivedAddress = verifyMessage(message, signature);

    if (derivedAddress.toLowerCase() === address.toLowerCase()) {
      try {
        await this.landService.createFreeLandSlots(address, gameKeyId);
      } catch {
        throw BreedingError('Error during open up free slots');
      }

      const user = await this.prismaService.user.upsert({
        create: {
          address: address,
          signature: signature,
          gameKeyId: gameKey,
        },
        update: {
          signature: signature,
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
