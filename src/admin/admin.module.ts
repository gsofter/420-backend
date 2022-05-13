import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppGateway } from 'src/app.gateway';
import { BudModule } from 'src/bud/bud.module';
import { AdminGuardStrategy } from 'src/guards/admin.guard';
import { LandModule } from 'src/land/land.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule, BudModule, LandModule, UserModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuardStrategy, AppGateway]
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
}

