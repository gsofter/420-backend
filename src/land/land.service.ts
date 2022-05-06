import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LandService {
  private readonly logger = new Logger('LandService');

  constructor(private readonly prismaService: PrismaService) {}

  async findOpenBreedSlots(userAddress: string, gameKeyTokenId?: number, slotId?: number) {
    const where: any = {
      userAddress,
      isOpen: true,
      isUsed: false,
      gameKeyTokenId,
      id: slotId,
    };

    const slots = await this.prismaService.breedSlot.findMany({
      where
    });

    return slots;
  }

  async createFreeLandSlots(userAddress: string, gameKeyId: number) {
    const count = await this.prismaService.breedSlot.count({
      where: {
        gameKeyTokenId: gameKeyId,
        userAddress,
        landTokenId: null,
      },
    });

    if (count > 0) {
      // Already opened free land slot
      return;
    }

    const data: Array<{
      gameKeyTokenId: number;
      userAddress: string;
      isOpen: boolean;
    }> = [];

    for (let i = 0; i < 5; i++) {
      data.push({
        gameKeyTokenId: gameKeyId,
        userAddress,
        isOpen: false,
      });
    }

    data[0].isOpen = true;

    await this.prismaService.breedSlot.createMany({
      data,
    });
  }

  async createNewLandSlots(userAddress: string, landTokenId: number) {
    const count = await this.prismaService.breedSlot.count({
      where: {
        userAddress,
        landTokenId,
      },
    });

    if (count > 0) {
      // Already created slots for this land ID
      return;
    }

    const data: Array<{
      landTokenId: number;
      userAddress: string;
      isOpen: boolean;
    }> = [];

    for (let i = 0; i < 5; i++) {
      data.push({
        userAddress,
        landTokenId,
        isOpen: false,
      });
    }

    data[0].isOpen = true;

    await this.prismaService.breedSlot.createMany({
      data,
    });
  }
}
