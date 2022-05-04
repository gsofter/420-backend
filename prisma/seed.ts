import { PrismaClient, Prisma } from '@prisma/client';
import gen1RequestIds from './seeds/gen1MintRequest';
import giftCardRequestIds from './seeds/giftCardRequest';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding Gen1MintRequest ...`);

  const count = await prisma.gen1MintRequest.count();
  if (count > 0) {
    console.log(
      `There are already ${count} requestIds in the Gen1MintRequest table, aborting...`,
    );
    return;
  }

  let requestIds = gen1RequestIds();
  let failed = 0;
  for (const id of requestIds) {
    try {
      await prisma.gen1MintRequest.create({
        data: {
          id,
        },
      });
    } catch (e) {
      failed++;
      console.log(`Failed to create Gen1MintRequest ${id}`);
    }
  }
  console.log(
    `Seeding Gen1MintRequest finished. Added ${
      requestIds.length - failed
    } records.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
