import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LandService {
  private readonly logger = new Logger('LandService');

  constructor(private readonly prismaService: PrismaService) {}

  async findOpenBreedSlots(userAddress: string, gameKeyId?: number, slotId?: number) {
    const where: any = {
      userAddress,
      isOpen: true,
      isUsed: false,
      gameKeyId,
      id: slotId,
      deletedAt: null,
    };

    const slots = await this.prismaService.breedSlot.findMany({
      where
    });

    return slots;
  }

  findOpenBreedSlotById(userAddress: string, slotId: number) {
    return this.prismaService.breedSlot.findFirst({
      where: {
        userAddress,
        isOpen: true,
        isUsed: false,
        id: slotId,
        deletedAt: null,
      }
    });
  }

  async createFreeLandSlots(userAddress: string, gameKeyId: number) {
    const count = await this.prismaService.breedSlot.count({
      where: {
        gameKeyId,
        userAddress,
        landTokenId: null,
        deletedAt: null,
      },
    });

    if (count > 0) {
      // Already opened free land slot
      this.logger.log('land is already created for given game key', { gameKeyId, userAddress, count });
      return;
    }

    const data: Array<{
      gameKeyId: number;
      userAddress: string;
      isOpen: boolean;
    }> = [];

    for (let i = 0; i < 5; i++) {
      data.push({
        gameKeyId,
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
        deletedAt: null,
      },
    });

    if (count > 0) {
      // Already created slots for this land ID
      this.logger.log('land is already created for landTokenId', { landTokenId, userAddress, count });
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
