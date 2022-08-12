import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Logger,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { verifyMessage } from 'ethers/lib/utils';
import type { Request } from 'src/types';
import {
  BadRequestError,
  BreedingError,
  NotFoundError,
  UnproceesableEntityError,
} from 'src/utils/errors';
import { LoginDto } from './dto/login.dto';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { LandService } from 'src/land/land.service';
import { ConvertBPDto } from './dto/convert.dto';
import { signMintRequest } from 'src/utils/onchain/sign';

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

  @Put('convertBp2High')
  async convertBp2High(@Req() req: Request, @Body() body: ConvertBPDto) {
    const { amount } = body;
    const { user : address } = req;
    
    const user = await this.prismaService.user.findUnique({
      where: { address },
      select: {
        breedingPoint: true,
      },
    });

    if (!user) {
      throw NotFoundError('User not found.');
    }

    if (user.breedingPoint < amount) {
      throw UnproceesableEntityError('Not enough balance');
    }

    const timestamp = new Date().getTime();
    const signature = await signMintRequest(
      address,
      "ConvertBP2HIGH",
      0,
      amount * 100,
      timestamp,
    );

    return {
      success: true,
      data: {
        signature,
        timestamp,
        amount: amount * 100,
      }
    }
  }
}
