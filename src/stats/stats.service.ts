import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JsonRpcProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { PrismaService } from 'src/prisma/prisma.service';
import { Network } from 'src/types';
import { multicall } from 'src/utils/multicall';
import * as Gen0BudLock from 'src/abis/gen0BudLock.json';
import * as Erc1155Abi from 'src/abis/ogErc1155.json';
import { ADDRESSES } from 'src/config';
import { QueryStatsDto } from './dto/search-breeder.dto';

@Injectable()
export class StatsService {
  private readonly logger = new Logger('StatsService');
  private rpcProvider: JsonRpcProvider;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {
    this.rpcProvider = new ethers.providers.StaticJsonRpcProvider(
      configService.get<string>('network.rpc'),
      configService.get<number>('network.chainId'),
    );
  }

  @Cron('10 * * * * *')
  async snapshotBreeding() {
    this.logger.log('Called every minute, on the 10th second');

    // this.snapshotSuccessfulBreedings();
    // this.snapshotFailedBreedings();
    // this.snapshotCanceledBreedings();

    const startTime = Date.now();
    // await this.snapshotTotalBreedingHours();

    console.log('took time', (Date.now() - startTime).toLocaleString() + 'ms');
  }
  
  async queryStats({ limit, cursor } : QueryStatsDto) {
    return this.prismaService.stats.findMany({
      take: limit ? (limit > 100 ? 100 : limit) : 100, 
      skip: cursor ? 1 : undefined,
      cursor: cursor ? {
        id: cursor,
      } : undefined,
      where: {
        totalHours: {
          gte: 0,
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async queryStatsByAddress(address: string) {
    return this.prismaService.stats.findUnique({
      where: {
        address
      },
    })
  }

  async snapshotSuccessfulBreedings() {
    const result = await this.prismaService.$queryRaw`
      INSERT
        INTO
        "Stats" ("address",
        "totalSuccess",
        "updatedAt")
      SELECT
          "userAddress" AS "address",
          count(*) AS "totalSuccess",
          NOW() AS "updatedAt"
      FROM
          public."BreedPair"
      WHERE
          "status" = 'COMPLETED'
      GROUP BY
          "userAddress"
      ON
        conflict ("address") do
      UPDATE
      SET
        "address" = EXCLUDED."address",
        "totalSuccess" = EXCLUDED."totalSuccess",
        "updatedAt" = EXCLUDED."updatedAt"
    `;

    return result;
  }

  async snapshotFailedBreedings() {
    const result = await this.prismaService.$queryRaw`
      INSERT
        INTO
        "Stats" ("address",
        "totalFailure",
        "updatedAt")
      SELECT
          "userAddress" AS "address",
          count(*) AS "totalFailure",
          NOW() AS "updatedAt"
      FROM
          public."BreedPair"
      WHERE
          "status" = 'FAILED'
        AND
          "currentLevel" = 5
      GROUP BY
          "userAddress"
      ON
        conflict ("address") do
      UPDATE
      SET
        "address" = EXCLUDED."address",
        "totalFailure" = EXCLUDED."totalFailure",
        "updatedAt" = EXCLUDED."updatedAt"
    `;

    return result;
  }

  async snapshotCanceledBreedings() {
    const result = await this.prismaService.$queryRaw`
      INSERT
        INTO
        "Stats" ("address",
        "totalCancels",
        "updatedAt")
      SELECT
          "userAddress" AS "address",
          count(*) AS "totalCancels",
          NOW() AS "updatedAt"
      FROM
          public."BreedPair"
      WHERE
          "status" = 'CANCELED'
      GROUP BY
          "userAddress"
      ON
        conflict ("address") do
      UPDATE
      SET
        "address" = EXCLUDED."address",
        "totalCancels" = EXCLUDED."totalCancels",
        "updatedAt" = EXCLUDED."updatedAt"
    `;

    return result;
  }

  async snapshotTotalBreedingHours() {
    // 2 days breeding (before Jun 6, 2022), without game item
    await this.prismaService.$queryRaw`
      insert
        into
        "Stats" ("address",
        "totalHours",
        "updatedAt")
      select
          "userAddress" as "address",
          (count(*) * 5 * 2 * 24) as "totalHours",
          now() as "updatedAt"
      from
          public."BreedPair"
      where
        "createdAt" < timestamp '2022-06-06 00:00:00'
        and 
        ("status" = 'COMPLETED'
          or ("status" = 'FAILED'
            and "currentLevel" = 5))
        and ("gameItemId" is null
          or "gameItemId" = 5)
      group by
          "userAddress"
      on
          conflict ("address") do
          update
      set
            "address" = EXCLUDED."address",
            "totalHours" = EXCLUDED."totalHours",
            "updatedAt" = EXCLUDED."updatedAt"
    `;

    // 1 day breeding (after Jun 6, 2022), without game item
    await this.prismaService.$queryRaw`
      insert
        into
        "Stats" ("address",
        "totalHours",
        "updatedAt")
      select
          "userAddress" as "address",
          (count(*) * 5 * 24) as "totalHours",
          now() as "updatedAt"
      from
          public."BreedPair"
      where
        "createdAt" >= timestamp '2022-06-06 00:00:00'
        and 
        ("status" = 'COMPLETED'
          or ("status" = 'FAILED'
            and "currentLevel" = 5))
        and ("gameItemId" is null
          or "gameItemId" = 5)
      group by
          "userAddress"
      on
          conflict ("address") do
          update
      set
            "address" = EXCLUDED."address",
            "totalHours" = coalesce("Stats"."totalHours", 0) + EXCLUDED."totalHours",
            "updatedAt" = EXCLUDED."updatedAt"
    `;

    // 1 day breeding, with farmer pass
    await this.prismaService.$queryRaw`
      insert
        into
        "Stats" ("address",
        "totalHours",
        "updatedAt")
      select
          "userAddress" as "address",
          (count(*) * 5 * 12) as "totalHours",
          now() as "updatedAt"
      from
          public."BreedPair"
      where
        "createdAt" >= timestamp '2022-06-06 00:00:00'
        and 
        ("status" = 'COMPLETED'
          or ("status" = 'FAILED'
            and "currentLevel" = 5))
        and "gameItemId" = 4
      group by
          "userAddress"
      on
          conflict ("address") do
          update
      set
            "address" = EXCLUDED."address",
            "totalHours" = coalesce("Stats"."totalHours", 0) + EXCLUDED."totalHours",
            "updatedAt" = EXCLUDED."updatedAt"
    `;

    // 1 day breeding, with super weed  ( 24 * 4 = 5 * 24 / 5 / 4)
    await this.prismaService.$queryRaw`
      insert
        into
        "Stats" ("address",
        "totalHours",
        "updatedAt")
      select
          "userAddress" as "address",
          (count(*) * 24 * 4) as "totalHours",
          now() as "updatedAt"
      from
          public."BreedPair"
      where
        "createdAt" >= timestamp '2022-06-06 00:00:00'
        and 
        ("status" = 'COMPLETED'
          or ("status" = 'FAILED'
            and "currentLevel" = 5))
        and "gameItemId" = 3
      group by
          "userAddress"
      on
          conflict ("address") do
          update
      set
            "address" = EXCLUDED."address",
            "totalHours" = coalesce("Stats"."totalHours", 0) + EXCLUDED."totalHours",
            "updatedAt" = EXCLUDED."updatedAt"
    `;
  }


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
      WHERE "rank" <= 30
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

  async getGen0BudLockCounts(addresses: string[]): Promise<number[]> {
    const network = this.configService.get<Network>('network.name');
    const calls = addresses.map((address) => ({
      contractAddress: ADDRESSES[network].BUD_BURN,
      functionName: 'burntAmount',
      params: [address],
    }));
    const startTime = Date.now();

    if (addresses.length > 200) {
      throw new Error(`address count (${addresses.length}), multicall max limit exceeds`);
    }
    
    try {
      const amounts = await multicall(
        this.rpcProvider,
        ADDRESSES[network].MULTICALL,
        Gen0BudLock,
        calls,
      );

      this.logger.log(
        'getGen0BudLockCounts RPC call time (ms): ' + (Date.now() - startTime),
      );

      for (let i = 0; i < amounts.length; i++) {
        amounts[i] = Number(amounts[i]);
      }

      return amounts;
    } catch (e) {
      this.logger.log(
        'getGen0BudLockCounts RPC call time (ms): ' + (Date.now() - startTime),
      );

      this.logger.error(
        'getGen0BudLockCounts multicall error: ' + e.message,
        e,
      );
      throw new Error('Get Bud Lock counts... RPC call error');
    }
  }

  async getGameItemMintCounts(addresses: string[]): Promise<number[]> {
    const network = this.configService.get<Network>('network.name');
    const itemIds = [1, 2, 3, 4, 5];
    const calls = [];
    const startTime = Date.now();

    if (addresses.length > 200) {
      throw new Error(`address count (${addresses.length}), multicall max limit exceeds`);
    }

    for (const address of addresses) {
      calls.push({
        contractAddress: ADDRESSES[network].GAME_ITEM,
        functionName: 'balanceOfBatch',
        params: [Array(itemIds.length).fill(address), itemIds],
      });
    }

    try {
      const batchAmounts = await multicall(
        this.rpcProvider,
        ADDRESSES[network].MULTICALL,
        Erc1155Abi,
        calls,
      );

      this.logger.log(
        'getGameItemMintCounts RPC call time (ms): ' + (Date.now() - startTime),
      );

      const amounts = [];
      for (let i = 0; i < batchAmounts.length; i++) {
        let sum = 0;
        for (const amount of batchAmounts[i]) {
          sum += Number(amount);
        }

        amounts.push(sum);
      }

      return amounts;
    } catch (e) {
      this.logger.log(
        'getGameItemMintCounts RPC call time (ms): ' + (Date.now() - startTime),
      );
      
      this.logger.error(
        'getGameItemMintCounts multicall error: ' + e.message,
        e,
      );
      throw new Error('Get Game item mint counts... RPC call error');
    }
  }
}
