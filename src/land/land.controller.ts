import { Body, Controller, forwardRef, Get, Inject, Put, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BreedSlotType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Request } from 'src/types';
import { UserService } from 'src/user/user.service';
import { BadRequestError, NotFoundError } from 'src/utils/errors';
import { OpenSlotDto } from './dto/land.dto';

@Controller('lands')
export class LandController {
  private bpToOpen = 0;
  private bpForIndoor = 0;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,

    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {
    this.bpToOpen = this.configService.get<number>('breed.breedingPointToOpenSlot');
    this.bpForIndoor = this.configService.get<number>('breed.breedingPointToCovertIndoor');
  }

  @Get('slots')
  async getUserSlots(@Req() req: Request) {
    const { user } = req;

    const userLands = await this.prismaService.breedSlot.findMany({
      where: {
        userAddress: user,
      },
    });

    return {
      success: true,
      data: userLands,
    };
  }

  @Put('openSlot')
  async openSlot(@Req() req: Request, @Body() { slotId }: OpenSlotDto) {
    const { user } = req;

    let slot = await this.prismaService.breedSlot.findFirst({
      where: {
        id: slotId,
        userAddress: user,
      },
    });

    if (!slot) {
      throw NotFoundError('Slot not found');
    }

    if (slot.isOpen) {
      throw BadRequestError('Slot is already open');
    }

    // Consume breeding point
    await this.userService.consumeBreedingPoint(user, this.bpToOpen);

    // Update slot information
    slot = await this.prismaService.breedSlot.update({
      where: {
        id: slotId,
      },
      data: {
        isOpen: true,
      },
    });

    return {
      success: true,
      data: slot,
    };
  }

  @Put('convertIndoor')
  async convertIndoor(@Req() req: Request, @Body() { slotId }: OpenSlotDto) {
    const { user } = req;

    let slot = await this.prismaService.breedSlot.findFirst({
      where: {
        id: slotId,
        userAddress: user,
      },
    });

    if (!slot) {
      throw NotFoundError('Slot not found');
    }

    if (slot.type === BreedSlotType.INDOOR) {
      throw BadRequestError('This slot is already INDOOR type');
    }

    // Consume breeding point
    await this.userService.consumeBreedingPoint(user, this.bpForIndoor);

    // Update slot information
    slot = await this.prismaService.breedSlot.update({
      where: {
        id: slotId,
      },
      data: {
        type: BreedSlotType.INDOOR,
      },
    });

    return {
      success: true,
      data: slot,
    };
  }
}
