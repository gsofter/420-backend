import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StatsService {
  private readonly logger = new Logger('StatsService');

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  async getBPDepositHistory(address: string) {
    const records = await this.prismaService.eventServiceLog.findMany({
      where: {
        address,
        type: 'DEPOSIT_BP',
      },
      select: {
        txHash: true,
        blockNumber: true,
        data: true,
        createdAt: true,
      },
    });

    return records.map((record) => {
      const { data, ...rest } = record;
      return {
        ...rest,
        amount: JSON.parse(data)?.amount / 100 || null,
      };
    });
  }

  async getBreedingMetrics() {
    const result = await this.prismaService.$queryRaw<[{ count: number }]>`
      SELECT
        count(*),
        "status"
      FROM "BreedPair"
      GROUP BY "status";
    `;

    return result;
  }

  async getBreeder(address: string) {
    const result = await this.prismaService.$queryRaw<
      [{ rank: number; count: number; minterAddress: string }]
    >`
      SELECT *
      FROM (
        SELECT
          DENSE_RANK() OVER(ORDER BY count DESC) AS rank,
          "count",
          "minterAddress"
        FROM (
          SELECT
            count(*) as count,
            "minterAddress"
          FROM "Gen1Bud"
          GROUP BY "minterAddress"
        ) AS mintCounts
      ) AS rankTable
      WHERE "minterAddress" = ${address};
    `;

    return result;
  }

  async getTopBreeders() {
    const result = await this.prismaService.$queryRaw<
      [{ rank: number; count: number; minterAddress: string }]
    >`
      SELECT * 
      FROM (
        SELECT
          DENSE_RANK() OVER(ORDER BY count DESC) AS rank,
          "count",
          "minterAddress"
        FROM (
          SELECT
            count(*) as count,
            "minterAddress"
          FROM "Gen1Bud"
          GROUP BY "minterAddress"
        ) AS mintCounts
      ) AS "rankTable"
      WHERE "rank" <= 100
      ;
    `;

    return result;
  }

  async getUserMetrics() {
    const result = await this.prismaService.$queryRaw<[{ count: number }]>`
      SELECT count(*)
      FROM "User"
    `;

    return result;
  }

  async getSlotMetrics() {
    const result = await this.prismaService.$queryRaw<[{ count: number }]>`
    SELECT
      "type",
      count(*)
    FROM "BreedSlot"
    GROUP BY "type"
    `;

    return result;
  }
}
