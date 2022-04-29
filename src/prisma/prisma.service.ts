import { Injectable, OnModuleInit, INestApplication, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, "query", false> implements OnModuleInit {
  private logger = new Logger('PrismaService');

  constructor(private readonly configService: ConfigService) {
    super({
      log: [
        "info", "warn", "error",
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();

    const isProd = this.configService.get('env.isProd');
    if (!isProd) {
      this.enableLogQuery();
    }
  }

  async enableLogQuery() {
    this.$on('query', async (e) => {
      this.logger.log(`Query: ${e.query}`);
      this.logger.log(`Params: ${e.params}`);
    });
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
