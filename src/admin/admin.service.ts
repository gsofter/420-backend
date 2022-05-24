import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UnproceesableEntityError } from 'src/utils/errors';

@Injectable()
export class AdminService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async validateTransaction(txHash: string, type: EventType) {
    const existing = await this.prismaService.eventServiceLog.count({
      where: {
        txHash,
        type
      }
    })

    if (existing > 0) {
      throw UnproceesableEntityError('Already handled this transaction');
    }
  }

  checkTransaction(txHash: string, type: EventType) {
  }
}
