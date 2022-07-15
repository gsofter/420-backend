import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StatsService {
  private readonly logger = new Logger('StatsService');

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService
  ) {

  }

  async getBPDepositHistory(address: string) {
    const records = await this.prismaService.eventServiceLog.findMany({
      where: {
        address,
        type: 'DEPOSIT_BP'
      },
      select: {
        txHash: true,
        blockNumber: true,
        data: true,
        createdAt: true,
      }
    });

    return records.map(record => {
      const { data, ...rest } = record;
      return {
        ...rest,
        amount: (JSON.parse(data))?.amount / 100 || null
      }
    });
  }

  async getBreedingMetrics() {
    const result = await this.prismaService.$queryRaw<[{count: number}]>`
      SELECT
        count(*),
        "status"
      FROM "BreedPair"
      GROUP BY "status";
    `;

    return result;
  }

  async getUserMetrics() {
    const result = await this.prismaService.$queryRaw<[{count: number}]>`
      SELECT count(*)
      FROM "User"
    `;

    return result;
  }

  async getSlotMetrics() {
    const result = await this.prismaService.$queryRaw<[{count: number}]>`
    SELECT
      "type",
      count(*)
    FROM "BreedSlot"
    GROUP BY "type"
    `;

    return result;
  }
}
