import { PrismaClient, Prisma } from '@prisma/client';
import gen1RequestIds from './seeds/gen1MintRequest';
import giftCardRequestIds from './seeds/giftCardRequest';

const prisma = new PrismaClient();

async function main() {
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
