import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

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
    PrismaModule,
    HashTableModule,
    UserModule,
    BreedModule,
    PrismaModule,
    BudModule,
    LandModule,
    GiftCardModule,
    AdminModule,
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
  }
}
