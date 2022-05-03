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

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../.env',
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    HashTableModule,
    UserModule,
    BreedModule,
    PrismaModule,
    BudModule,
  ],
  controllers: [AppController],
  providers: [AppGateway],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('breeds/*');
  }
}
