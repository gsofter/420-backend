import { Prisma, Stats } from '@prisma/client';
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

  @Cron('0 10 * * * *')
  async snapshotBreeding() {
    this.logger.log('Called every hour, at the start of the 10th minute');
    const startTime = Date.now();

    // Clean up first
    await this.prismaService.$queryRaw`TRUNCATE TABLE public."Stats" RESTART IDENTITY`;

    // Snapshot again
    await this.snapshotSuccessfulBreedings();
    await this.snapshotFailedBreedings();
    await this.snapshotCanceledBreedings();
    await this.snapshotTotalBreedingHours();
    await this.snapshotSpentBPsForBreeding();
    await this.snapshotSpentBpsForLandUpgrade();
    await this.snapshotBurnedG0Buds();

    console.log('snapshotBreeding took time', (Date.now() - startTime).toLocaleString() + 'ms');
  }
  
  async queryStats({ limit, cursor } : QueryStatsDto): Promise<Array<Stats & { rank: number}>> {
    const take = limit ? (limit > 100 ? 100 : limit) : 100;

    if (cursor) {
      return this.prismaService.$queryRaw`
        SELECT 
          "stats_original".*
        FROM
          (
            SELECT
              *,
              RANK() OVER(ORDER BY "score" DESC) AS "rank"
            FROM (
              SELECT
                *,
                ${Prisma.raw(this.getStatsScoreQuery('score'))}
              FROM "public"."Stats"
            ) AS "with_score"
          ) AS "stats_original",
          (
          SELECT
            ${Prisma.raw(this.getStatsScoreQuery('score_comp'))}
          FROM
            "public"."Stats"
          WHERE
            ("public"."Stats"."id") = (${cursor})) AS "order_cmp"
        WHERE
          "stats_original"."score" <= "order_cmp"."score_comp"
        ORDER BY
          "stats_original"."score" DESC 
        LIMIT ${take} OFFSET 1
      `
    };

    return this.prismaService.$queryRaw`
      SELECT 
        *,
        RANK() OVER(ORDER BY "score" DESC) AS "rank"
      FROM (
        SELECT
          *,
          ${Prisma.raw(this.getStatsScoreQuery())}
        FROM
          "public"."Stats"
      ) as "with_score"
      ORDER BY
        "score" DESC
      LIMIT ${take}
    `;

    // return this.prismaService.stats.findMany({
    //   take, 
    //   skip: cursor ? 1 : undefined,
    //   cursor: cursor ? {
    //     id: cursor,
    //   } : undefined,
    //   where: {
    //     totalHours: {
    //       gte: 0,
    //     }
    //   },
    //   orderBy: {
    //     createdAt: 'desc',
    //   },
    // })
  }

  getStatsScoreQuery(name = 'score') {
    // n(SBC) + n(DB) - n(FBC) + n(BB) + n(BP) + n(SL) - n(CB) + n(BG)
    return `(coalesce("totalSuccess", 0) * 15 +
    coalesce("totalHours", 0) * 0.01 - 
    coalesce("totalFailure", 0) * 0.05 + 
    coalesce("bpForBreeding", 0) * 0.01 + 
    coalesce("bpForLandUpgrade", 0) * 0.02 - 
    coalesce("totalCancels", 0) * 1.25 +
    coalesce("burnedBuds", 0) * 1.1 
    ) as "${name}"`;
  }

  async queryStatsByAddress(address: string) {
    const stats = await this.prismaService.$queryRaw<[Stats & { rank:number }]>`
      SELECT *
      FROM (
        SELECT
          *,
          RANK() OVER(ORDER BY "score" DESC) AS "rank"
        FROM (
          SELECT *, ${Prisma.raw(this.getStatsScoreQuery())}
          FROM "Stats"
        ) AS "with_score"
      ) AS "with_rank"
      WHERE "address" = ${address}
    `;

    if (!Array.isArray(stats) || !stats[0]?.address) {
      return null;
    }

    return stats[0];
  }

  async snapshotSpentBPsForBreeding() {
    await this.prismaService.$queryRaw`
      INSERT
        INTO
        "Stats" ("address",
        "bpForBreeding",
        "updatedAt")
      SELECT 
        "address",
        SUM("bpSpent") AS "bpForBreeding",
        NOW() AS "updatedAt"
      FROM
        (
        SELECT
          "userAddress" AS "address",
          ("currentLevel" * 15) AS "bpSpent"
        FROM
          public."BreedPair"
      ) AS "temp"
      GROUP BY
        "address"
      ON
          conflict ("address") DO
          UPDATE
      SET
            "address" = EXCLUDED."address",
            "bpForBreeding" = coalesce("Stats"."bpForBreeding", 0) + EXCLUDED."bpForBreeding",
            "updatedAt" = EXCLUDED."updatedAt"
    `;
  }

  async snapshotSpentBpsForLandUpgrade() {
    await this.prismaService.$queryRaw`
      INSERT
        INTO
        "Stats" ("address",
        "bpForLandUpgrade",
        "updatedAt")
      SELECT
          "userAddress" AS "address",
          (count(*) * 69) AS "bpForLandUpgrade",
          NOW() AS "updatedAt"
      FROM
          public."BreedSlot"
      WHERE
        "type" = 'INDOOR'
      GROUP BY
          "userAddress"
      ON
          conflict ("address") DO
          UPDATE
      SET
            "address" = EXCLUDED."address",
            "bpForLandUpgrade" = EXCLUDED."bpForLandUpgrade",
            "updatedAt" = EXCLUDED."updatedAt"
    `;
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

  async snapshotBurnedG0Buds() {
    const result = await this.prismaService.$queryRaw`
      INSERT
        INTO
        "Stats" ("address",
        "burnedBuds",
        "updatedAt")
      SELECT
          "address",
          count(*) * 2 AS "burnedBuds",
          NOW() AS "updatedAt"
      FROM
          public."EventServiceLog"
      WHERE
          "type" = 'BURN_GEN0'
      GROUP BY
          "address"
      ON
        conflict ("address") do
      UPDATE
      SET
        "address" = EXCLUDED."address",
        "burnedBuds" = EXCLUDED."burnedBuds",
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
    await this.prismaService.$queryRaw`
      INSERT
        INTO
        "Stats" ("address",
        "totalHours",
        "updatedAt")
      SELECT 
        "address",
        SUM("hoursSpent") AS "totalHours",
        NOW() AS "updatedAt"
      FROM
        (
        SELECT
          "userAddress" AS "address",
          ("currentLevel" * (CASE
            WHEN "createdAt" < TIMESTAMP '2022-06-06 00:00:00' THEN 48
            ELSE 24
          END) * (CASE
            WHEN "gameItemId" = 4 THEN 0.5
            WHEN "gameItemId" = 3 THEN 0.8
            ELSE 1
          END)) AS "hoursSpent"
        FROM
          public."BreedPair"
      ) AS "temp"
      GROUP BY
        "address"
      ON
          conflict ("address") DO
          UPDATE
      SET
            "address" = EXCLUDED."address",
            "totalHours" = EXCLUDED."totalHours",
            "updatedAt" = EXCLUDED."updatedAt"
    `;
    // 2 days breeding (before Jun 6, 2022), without game item
    // await this.prismaService.$queryRaw`
    //   INSERT
    //     INTO
    //     "Stats" ("address",
    //     "totalHours",
    //     "updatedAt")
    //   SELECT
    //       "userAddress" AS "address",
    //       (count(*) * 5 * 2 * 24) AS "totalHours",
    //       NOW() AS "updatedAt"
    //   FROM
    //       public."BreedPair"
    //   where
    //     "createdAt" < timestamp '2022-06-06 00:00:00'
    //     and 
    //     ("status" = 'COMPLETED'
    //       or ("status" = 'FAILED'
    //         and "currentLevel" = 5))
    //     and ("gameItemId" is null
    //       or "gameItemId" = 5)
    //   GROUP BY
    //       "userAddress"
    //   on
    //       conflict ("address") do
    //       UPDATE
    //   SET
    //         "address" = EXCLUDED."address",
    //         "totalHours" = EXCLUDED."totalHours",
    //         "updatedAt" = EXCLUDED."updatedAt"
    // `;

    // 1 day breeding (after Jun 6, 2022), without game item
    // await this.prismaService.$queryRaw`
    //   INSERT
    //     INTO
    //     "Stats" ("address",
    //     "totalHours",
    //     "updatedAt")
    //   SELECT
    //       "userAddress" AS "address",
    //       (count(*) * 5 * 24) AS "totalHours",
    //       NOW() AS "updatedAt"
    //   FROM
    //       public."BreedPair"
    //   where
    //     "createdAt" >= timestamp '2022-06-06 00:00:00'
    //     and 
    //     ("status" = 'COMPLETED'
    //       or ("status" = 'FAILED'
    //         and "currentLevel" = 5))
    //     and ("gameItemId" is null
    //       or "gameItemId" = 5)
    //   GROUP BY
    //       "userAddress"
    //   on
    //       conflict ("address") do
    //       UPDATE
    //   SET
    //         "address" = EXCLUDED."address",
    //         "totalHours" = coalesce("Stats"."totalHours", 0) + EXCLUDED."totalHours",
    //         "updatedAt" = EXCLUDED."updatedAt"
    // `;

    // 1 day breeding, with farmer pass
    // await this.prismaService.$queryRaw`
    //   INSERT
    //     INTO
    //     "Stats" ("address",
    //     "totalHours",
    //     "updatedAt")
    //   SELECT
    //       "userAddress" AS "address",
    //       (count(*) * 5 * 12) AS "totalHours",
    //       NOW() AS "updatedAt"
    //   FROM
    //       public."BreedPair"
    //   where
    //     "createdAt" >= timestamp '2022-06-06 00:00:00'
    //     and 
    //     ("status" = 'COMPLETED'
    //       or ("status" = 'FAILED'
    //         and "currentLevel" = 5))
    //     and "gameItemId" = 4
    //   GROUP BY
    //       "userAddress"
    //   on
    //       conflict ("address") do
    //       UPDATE
    //   SET
    //         "address" = EXCLUDED."address",
    //         "totalHours" = coalesce("Stats"."totalHours", 0) + EXCLUDED."totalHours",
    //         "updatedAt" = EXCLUDED."updatedAt"
    // `;

    // 1 day breeding, with super weed  ( 24 * 4 = 5 * 24 / 5 / 4)
    // await this.prismaService.$queryRaw`
    //   INSERT
    //     INTO
    //     "Stats" ("address",
    //     "totalHours",
    //     "updatedAt")
    //   SELECT
    //       "userAddress" AS "address",
    //       (count(*) * 24 * 4) AS "totalHours",
    //       NOW() AS "updatedAt"
    //   FROM
    //       public."BreedPair"
    //   where
    //     "createdAt" >= timestamp '2022-06-06 00:00:00'
    //     and 
    //     ("status" = 'COMPLETED'
    //       or ("status" = 'FAILED'
    //         and "currentLevel" = 5))
    //     and "gameItemId" = 3
    //   GROUP BY
    //       "userAddress"
    //   on
    //       conflict ("address") do
    //       UPDATE
    //   SET
    //         "address" = EXCLUDED."address",
    //         "totalHours" = coalesce("Stats"."totalHours", 0) + EXCLUDED."totalHours",
    //         "updatedAt" = EXCLUDED."updatedAt"
    // `;
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
          RANK() OVER(ORDER BY count DESC) AS rank,
          "count",
          "minterAddress"
        FROM (
          SELECT
            count(*) AS count,
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
          RANK() OVER(ORDER BY count DESC) AS rank,
          "count",
          "minterAddress"
        FROM (
          SELECT
            count(*) AS count,
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
