import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventType } from '@prisma/client';
import { JsonRpcProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestError, UnproceesableEntityError } from 'src/utils/errors';
import { AdminDtoBase } from './dto/base.dto';
import { ADDRESSES } from 'src/config';
import { Network } from 'src/types';

@Injectable()
export class AdminService {
  private rpcProvider: JsonRpcProvider;
  private logger = new Logger('AdminService');
  private network: Network;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    this.rpcProvider = new ethers.providers.StaticJsonRpcProvider(
      configService.get<string>('network.rpc'),
      configService.get<number>('network.chainId'),
    );
    this.network = configService.get('network.name');
  }

  async validateTransaction(data: AdminDtoBase, type: EventType) {
    if (data.network !== this.configService.get<string>('network.name')) {
      throw BadRequestError('Invalid network');
    }

    const existing = await this.prismaService.eventServiceLog.count({
      where: {
        txHash: data.txHash,
        type
      }
    })

    if (existing > 0) {
      throw UnproceesableEntityError('Already handled this transaction');
    }

    // this.checkTransaction(data, type);
  }

  checkTransaction({ txHash, address }: AdminDtoBase, type: EventType) {    
    this.logger.log('Check transaction');

    this.rpcProvider.once(txHash, (...args) => {
      console.log('...args', args);
    });

    // Verify contract address

    const contractAddress = address;
    const ADDRESS_LIST = ADDRESSES[this.network];

    let isValidContract = false;
    if (type === EventType.BURN_GEN0) {
      isValidContract = contractAddress === ADDRESS_LIST.BUD_BURN;
    } else if (type === EventType.DEPOSIT_BP) {
      isValidContract = contractAddress === ADDRESS_LIST.BUD_BURN;
    } else if (type === EventType.MINT_LAND) {
      isValidContract = contractAddress === ADDRESS_LIST.GAME_ITEM;
    } else if (type === EventType.WITHDRAW_BP) {
      isValidContract = contractAddress === ADDRESS_LIST.BUD_BURN;
    }

    if (!isValidContract) {
      this.logger.error('Invalid contract address');
      throw UnproceesableEntityError('Incorrect transaction');
    }
  }
}
