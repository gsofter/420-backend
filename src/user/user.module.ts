import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthMiddleware } from 'src/middlewares/auth.middleware';
import { AdminGuardStrategy } from 'src/guards/admin.guard';
import { BudModule } from 'src/bud/bud.module';

@Module({
  imports: [PrismaModule, BudModule],
  providers: [UserService, AdminGuardStrategy],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude('/users/login', '/users/breedingPoint', '/users/burnBuds')
      .forRoutes(UserController);
  }
}
