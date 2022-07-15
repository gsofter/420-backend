import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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
      // TODO: Check if server is behind proxy https://docs.nestjs.com/security/rate-limiting#proxies
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
    consumer.apply(AuthMiddleware).forRoutes('stats/*');
  }
}
