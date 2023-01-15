import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatadogTraceModule } from 'nestjs-ddtrace';
import appConfig from './config/app.config';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { HashTableModule } from './hash-table/hash-table.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { BreedModule } from './breed/breed.module';
import { AppController } from './app.controller';
import { BudModule } from './bud/bud.module';
import { AppGateway } from './app.gateway';
import { LandModule } from './land/land.module';
import { GiftCardModule } from './gift-card/gift-card.module';
import { AdminModule } from './admin/admin.module';
import { StatsModule } from './stats/stats.module';
import { StatsController } from './stats/stats.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../.env',
      isGlobal: true,
      load: [appConfig],
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 60,
    }),
    DatadogTraceModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    HashTableModule,
    UserModule,
    BreedModule,
    PrismaModule,
    BudModule,
    LandModule,
    GiftCardModule,
    AdminModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [
    AppGateway,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('breeds/*');
    consumer.apply(AuthMiddleware).forRoutes('buds/*');
    consumer.apply(AuthMiddleware).forRoutes('lands/*');
    consumer.apply(AuthMiddleware).forRoutes('giftCards/*');
    consumer
      .apply(AuthMiddleware)
      .exclude('/stats', '/stats/:address', '/stats/metrics', '/stats/searchBreeder', '/stats/shopRequirements')
      .forRoutes(StatsController);
  }
}
