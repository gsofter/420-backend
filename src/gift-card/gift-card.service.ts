import { Injectable, Logger } from '@nestjs/common';
import { GiftAmount } from '@prisma/client';
import { HashTableService } from 'src/hash-table/hash-table.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { getGiftCardSupply, getGiftCardTypeId } from 'src/utils/gift-card';
import { randomNumber } from 'src/utils/number';
import { signMintRequest } from 'src/utils/onchain/sign';

@Injectable()
export class GiftCardService {
  private readonly logger = new Logger('GiftCardService');

  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashTableService: HashTableService,
  ) {}

  /**
   * Roll a dice and if wins under the chance, return a gift card reward entity
   *
   * @returns Nullable<{tokenId: number, amount: number, price: string}>
   */
  async dice(minter: string, pairId?: number) {
    const chance = randomNumber(100);

    const rewardType = this.hashTableService.lookUpRewardTable(chance);

    if (rewardType) {
      return await this.issueGitCardMint(
        minter,
        rewardType.price as GiftAmount,
        pairId,
      );
    }

    return null;
  }

  /**
   * Create a new GiftCard entity with a certain dollar amount and generate a mint signature on behalf of issuer.
   * Returns a card object
   *
   * @param minter string
   * @param value GiftAmount
   * @returns GitCard
   */
  async issueGitCardMint(minter: string, value: GiftAmount, pairId?: number) {
    const tokenId = getGiftCardTypeId(value);

    if (tokenId < 0) {
      this.logger.error('Invalid gift card amount: ' + value);
      return null;
    }

    const supply = getGiftCardSupply(value);
    const count = await this.prismaService.giftCard.count({
      where: {
        value,
      },
    });

    if (count >= supply) {
      this.logger.error(`Gift card supply is full for ${value}`);
      return null;
    }

    let card = await this.prismaService.giftCard.create({
      data: {
        value,
        minterAddress: minter,
        signature: '',
        pairId
      },
    });

    const signature = await signMintRequest(
      minter,
      tokenId,
      card.createdAt.getTime(),
    );

    card = await this.prismaService.giftCard.update({
      data: {
        signature,
      },
      where: {
        id: card.id,
      },
    });

    return card;
  }
}
