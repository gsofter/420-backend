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

  async getBreedingMetrics() {
    const result = await this.prismaService.$queryRaw<[{count: number}]>`
      SELECT count(*)
      FROM "User"
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
}
